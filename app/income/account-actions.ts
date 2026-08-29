"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { formatMonthYear } from "@/lib/format-date";
import {
  createAccountStatementWithLines,
  deleteAccountStatement,
  getAccountStatementByPeriod,
  type CreateAccountLineInput,
} from "@/lib/db/account-statement.service";
import { accountStatementImportSchema } from "@/lib/validation/account-statement-import.schema";
import { extractPdfText } from "@/lib/pdf/extract-text";
import { parseEnparaAccountStatementText } from "@/lib/bank-account/parse-account-statement";
import { validateParsedAccountStatement } from "@/lib/bank-account/validate";
import type { ParsedAccountLine } from "@/lib/bank-account/types";

export type AnalyzeAccountStatementError = {
  status: "error";
  title: string;
  description: string;
};

export type AnalyzeAccountStatementSuccess = {
  status: "ok";
  fileName: string;
  statement: {
    year: number;
    month: number;
    statementDate: Date;
    periodStart: Date;
    periodEnd: Date;
    iban: string | null;
    openingBalance: number;
    closingBalance: number;
  };
  lines: ParsedAccountLine[];
  warnings: string[];
};

export type AnalyzeAccountStatementResult = AnalyzeAccountStatementError | AnalyzeAccountStatementSuccess;

/**
 * PDF'i okur, ayrıştırır, sınıflandırma önerir ve duplicate kontrolünden
 * geçirir — henüz DB'ye yazmaz. Yalnızca GELİR takip edildiği için (bkz.
 * lib/bank-account/types.ts) kategori tahmini burada YOK — kullanıcı
 * isterse önizlemede Gelir kategorisini (Maaş/Freelance/Diğer Gelir) elle seçer.
 */
export async function analyzeAccountStatementAction(formData: FormData): Promise<AnalyzeAccountStatementResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { status: "error", title: "Dosya bulunamadı.", description: "Lütfen bir PDF dosyası seçin." };
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { status: "error", title: "Geçersiz dosya türü.", description: "Sadece PDF dosyaları kabul edilir." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const parsed = await extractPdfText(buffer)
    .then(parseEnparaAccountStatementText)
    .catch((error: unknown) => {
      console.error("Hesap özeti ayrıştırma başarısız:", error);
      return null;
    });

  if (!parsed) {
    return {
      status: "error",
      title: "PDF okunamadı.",
      description: "Dosyanın geçerli bir Enpara hesap özeti olduğundan emin olun.",
    };
  }

  const existing = await getAccountStatementByPeriod(parsed.year, parsed.month);
  if (existing) {
    return {
      status: "error",
      title: "Bu hesap özeti zaten sisteme yüklenmiş.",
      description: `${formatMonthYear(parsed.year, parsed.month)} hesap özeti daha önce içe aktarılmış.`,
    };
  }

  const validation = validateParsedAccountStatement(parsed);

  return {
    status: "ok",
    fileName: file.name,
    statement: {
      year: parsed.year,
      month: parsed.month,
      statementDate: parsed.statementDate,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      iban: parsed.iban,
      openingBalance: parsed.openingBalance,
      closingBalance: parsed.closingBalance,
    },
    lines: parsed.lines,
    warnings: validation.warnings,
  };
}

export type SaveAccountStatementImportInput = {
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

/** Kullanıcının önizlemede düzenlediği hâliyle hesap özetini kalıcı olarak kaydeder. */
export async function saveAccountStatementImportAction(input: SaveAccountStatementImportInput): Promise<ActionState> {
  const parsed = accountStatementImportSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Hesap özeti verisi geçersiz." };
  }
  const data = parsed.data;

  const existing = await getAccountStatementByPeriod(data.year, data.month);
  if (existing) {
    return {
      status: "error",
      message: `${formatMonthYear(data.year, data.month)} hesap özeti zaten yüklenmiş. Aynı özet ikinci kez içe aktarılamaz.`,
    };
  }

  const incomeCount = data.lines.filter((l) => l.classification === "INCOME").length;

  try {
    await createAccountStatementWithLines(data);
  } catch (error) {
    console.error("Hesap özeti kaydetme başarısız:", error);
    return { status: "error", message: "Hesap özeti kaydedilemedi." };
  }

  revalidatePath("/income");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `${formatMonthYear(data.year, data.month)} hesap özeti içe aktarıldı: ${incomeCount} gelir eklendi.`,
  };
}

/** Yanlış PDF yüklendiğinde geri alma — `deleteStatementAction`'ın (statements/actions.ts) hesap özeti karşılığı. */
export async function deleteAccountStatementAction(id: string): Promise<ActionState> {
  try {
    await deleteAccountStatement(id);
  } catch (error) {
    console.error("Hesap özeti silme başarısız:", error);
    return { status: "error", message: "Hesap özeti silinemedi." };
  }

  revalidatePath("/income");
  return { status: "success", message: "Hesap özeti ve ilişkili tüm gelirler silindi." };
}
