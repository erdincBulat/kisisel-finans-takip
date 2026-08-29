import { prisma } from "./client";
import type { AccountLineClassification } from "@/lib/bank-account/types";

export function listAccountStatements() {
  return prisma.accountStatement.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] });
}

/** Hesap özeti benzersizliği year+month üzerinden kontrol edilir (kredi kartı ekstresiyle aynı mantık, spec §8). */
export function getAccountStatementByPeriod(year: number, month: number) {
  return prisma.accountStatement.findUnique({ where: { year_month: { year, month } } });
}

export type CreateAccountLineInput = {
  date: Date;
  description: string;
  amount: number; // kuruş, her zaman pozitif
  classification: AccountLineClassification;
  categoryId: string | null; // yalnızca INCOME için anlamlı (Maaş/Freelance/Diğer Gelir)
};

export type CreateAccountStatementInput = {
  year: number;
  month: number;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  iban: string | null;
  fileName: string;
  openingBalance: number;
  closingBalance: number;
  lines: CreateAccountLineInput[];
};

/**
 * AccountStatement + GELİR olarak işaretlenen satırları tek bir DB
 * transaction'ında oluşturur. Yalnızca gelir takip edilir (kullanıcı kararı):
 * HARİÇ TUT olarak işaretlenen satırlar (giden hareketlerin TAMAMI dahil —
 * bkz. lib/bank-account/classify.ts) hiç kaydedilmez, `Transaction` tablosuna
 * HİÇBİR ZAMAN yazılmaz — /transactions ve dashboard'un harcama tarafı bu
 * veriden tamamen bağımsız kalır. `Income` zaten var olan modeldir, bu yüzden
 * dashboard'un "Toplam Gelir" KPI'ı ek bir değişiklik gerekmeden bu veriyi kapsar.
 */
export function createAccountStatementWithLines(input: CreateAccountStatementInput) {
  return prisma.$transaction(async (tx) => {
    const statement = await tx.accountStatement.create({
      data: {
        year: input.year,
        month: input.month,
        statementDate: input.statementDate,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        iban: input.iban,
        fileName: input.fileName,
        openingBalance: input.openingBalance,
        closingBalance: input.closingBalance,
        lineCount: input.lines.length,
        status: "IMPORTED",
      },
    });

    const incomeLines = input.lines.filter((line) => line.classification === "INCOME");
    if (incomeLines.length > 0) {
      await tx.income.createMany({
        data: incomeLines.map((line) => ({
          date: line.date,
          description: line.description,
          amount: line.amount,
          categoryId: line.categoryId,
          accountStatementId: statement.id,
        })),
      });
    }

    return statement;
  });
}
