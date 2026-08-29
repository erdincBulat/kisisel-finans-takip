import { createHash } from "node:crypto";
import type { Prisma, TransactionSource, TransactionType } from "@prisma/client";
import { prisma } from "./client";

/** date+normalizedMerchant+amount+installment üzerinden duplicate koruma hash'i (spec §49). */
export function computeFingerprint(input: {
  date: Date;
  normalizedMerchant: string;
  amount: number;
  installmentCurrent?: number | null;
  installmentTotal?: number | null;
}) {
  const raw = [
    input.date.toISOString().slice(0, 10),
    input.normalizedMerchant.trim().toLowerCase(),
    input.amount,
    input.installmentCurrent ?? "",
    input.installmentTotal ?? "",
  ].join("|");

  return createHash("sha256").update(raw).digest("hex");
}

export type CreateTransactionInput = {
  date: Date;
  description: string;
  normalizedMerchant: string;
  amount: number; // kuruş
  type: TransactionType;
  source: TransactionSource;
  categoryId?: string | null;
  subCategoryId?: string | null;
  installmentCurrent?: number | null;
  installmentTotal?: number | null;
  statementId?: string | null;
  notes?: string | null;
};

export function createTransaction(input: CreateTransactionInput) {
  return prisma.transaction.create({
    data: {
      ...input,
      fingerprint: computeFingerprint(input),
    },
  });
}

export type UpdateTransactionInput = Partial<Omit<CreateTransactionInput, "source">>;

export function updateTransaction(id: string, input: UpdateTransactionInput) {
  return prisma.transaction.update({ where: { id }, data: input });
}

export function deleteTransaction(id: string) {
  return prisma.transaction.delete({ where: { id } });
}

/** Toplu kategori ataması — /transactions'ta çoklu seçim ile birden fazla işleme aynı anda kategori atamak için. */
export function bulkUpdateCategory(ids: string[], categoryId: string | null, subCategoryId: string | null) {
  return prisma.transaction.updateMany({
    where: { id: { in: ids } },
    data: { categoryId, subCategoryId },
  });
}

/**
 * Aynı `normalizedMerchant`'a sahip TÜM işlemlerin kategorisini günceller
 * (spec §11/§35'in "gelecekte de uygula" MerchantRule'undan farklı olarak,
 * bunu GEÇMİŞTEKİ mevcut işlemlere de anında uygular). `excludeTransactionId`
 * genelde az önce elle düzenlenen işlemdir — o zaten istenen kategoriyle
 * kaydedilmiş olur, tekrar güncellemeye gerek yoktur.
 */
export function updateCategoryByMerchant(
  normalizedMerchant: string,
  categoryId: string,
  subCategoryId: string | null,
  excludeTransactionId?: string,
) {
  return prisma.transaction.updateMany({
    where: {
      normalizedMerchant,
      ...(excludeTransactionId ? { id: { not: excludeTransactionId } } : {}),
    },
    data: { categoryId, subCategoryId },
  });
}

export function getTransactionById(id: string) {
  return prisma.transaction.findUnique({
    where: { id },
    include: { category: true, subCategory: true },
  });
}

/**
 * Bir işlemin GERÇEKTEN faturalandığı ay/yıl. Normal işlemlerde bu
 * `Transaction.date`'tir (CLAUDE.md genel kuralı: ay hesabı işlem tarihine
 * göre yapılır, ekstre dönemine göre değil).
 *
 * AMA ekstre kaynaklı taksitli işlemlerde `date` her zaman ORİJİNAL satın alma
 * tarihidir — Enpara her taksit satırında (2/3, 3/3, ...) aynı sabit tarihi
 * basıyor, o ayın faturalanma tarihini değil (gerçek veriyle doğrulandı: bir
 * satın alma 29/01/2026 tarihli, 2. taksiti Mart ekstresinde, 3. taksiti
 * Nisan ekstresinde göründü — ikisi de satırında "29/01/2026" taşıyor, bkz.
 * tests/parser/fixtures/README.md). Bu yüzden bu tür satırlar için gerçek
 * faturalanma ayı, satırın ait olduğu Statement'ın year/month'udur.
 * Manuel girilen taksitli işlemlerde bu sorun yok (kullanıcı tarihi doğrudan
 * o satır için giriyor), o yüzden yalnızca source=STATEMENT etkilenir.
 */
export function getEffectiveMonth(tx: {
  date: Date;
  source: TransactionSource;
  installmentTotal: number | null;
  statement: { year: number; month: number } | null;
}): { year: number; month: number } {
  if (tx.source === "STATEMENT" && tx.installmentTotal != null && tx.statement) {
    return { year: tx.statement.year, month: tx.statement.month };
  }
  return { year: tx.date.getUTCFullYear(), month: tx.date.getUTCMonth() + 1 };
}

/** Yukarıdaki kurala göre bir Prisma `where` koşulu üretir (spec §53). */
export function transactionMonthFilter(year: number, month: number): Prisma.TransactionWhereInput {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  return {
    OR: [
      { OR: [{ installmentTotal: null }, { source: "MANUAL" }], date: { gte: start, lt: end } },
      { installmentTotal: { not: null }, source: "STATEMENT", statement: { year, month } },
    ],
  };
}

export type TransactionFilters = {
  year?: number;
  month?: number; // 1-12, year ile birlikte kullanılır
  categoryId?: string;
  type?: TransactionType;
  source?: TransactionSource;
  onlyInstallments?: boolean;
  search?: string;
};

export function listTransactions(filters: TransactionFilters = {}) {
  const where: Prisma.TransactionWhereInput = {};
  const conditions: Prisma.TransactionWhereInput[] = [];

  if (filters.year && filters.month) {
    conditions.push(transactionMonthFilter(filters.year, filters.month));
  }

  if (filters.categoryId) {
    conditions.push({ OR: [{ categoryId: filters.categoryId }, { subCategoryId: filters.categoryId }] });
  }

  if (filters.type) where.type = filters.type;
  if (filters.source) where.source = filters.source;
  if (filters.onlyInstallments) where.installmentTotal = { not: null };

  if (filters.search) {
    conditions.push({
      OR: [
        { description: { contains: filters.search } },
        { normalizedMerchant: { contains: filters.search } },
      ],
    });
  }

  if (conditions.length > 0) where.AND = conditions;

  return prisma.transaction.findMany({
    where,
    include: { category: true, subCategory: true },
    orderBy: { date: "desc" },
  });
}
