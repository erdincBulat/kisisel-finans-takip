import { prisma } from "./client";
import { transactionMonthFilter } from "./transaction.service";

export class BudgetDuplicateError extends Error {}

async function assertNoDuplicate(categoryId: string, subCategoryId: string | null, excludeId?: string) {
  const existing = await prisma.budget.findFirst({
    where: { categoryId, subCategoryId, ...(excludeId ? { id: { not: excludeId } } : {}) },
  });
  if (existing) {
    throw new BudgetDuplicateError("Bu kategori için zaten bir bütçe tanımlı. Mevcut bütçeyi düzenleyin.");
  }
}

export type CreateBudgetInput = { categoryId: string; subCategoryId: string | null; limitAmount: number };

export async function createBudget(input: CreateBudgetInput) {
  await assertNoDuplicate(input.categoryId, input.subCategoryId);
  return prisma.budget.create({ data: input });
}

export async function updateBudget(id: string, input: CreateBudgetInput) {
  await assertNoDuplicate(input.categoryId, input.subCategoryId, id);
  return prisma.budget.update({ where: { id }, data: input });
}

export function deleteBudget(id: string) {
  return prisma.budget.delete({ where: { id } });
}

export type BudgetWithProgress = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  subCategoryId: string | null;
  subCategoryName: string | null;
  limitAmount: number; // kuruş
  spent: number; // kuruş, negatif (net iade) 0'a kırpılır
  remaining: number; // kuruş, negatifse aşım tutarı
  percent: number; // 0'dan büyük, aşımda 100'ü geçebilir
  exceeded: boolean;
};

type BudgetRow = {
  id: string;
  categoryId: string;
  category: { name: string; color: string };
  subCategoryId: string | null;
  subCategory: { name: string } | null;
  limitAmount: number;
};

type TransactionRow = { amount: number; type: "EXPENSE" | "REFUND" | "INCOME" | "PAYMENT"; categoryId: string | null; subCategoryId: string | null };

/**
 * Saf hesaplama çekirdeği — `buildInstallmentPlans`/`detectSubscriptions` ile
 * aynı ayrım (bkz. CLAUDE.md): DB'den bağımsız, doğrudan test edilebilir.
 * Alt kategorisi olmayan (subCategoryId: null) bir bütçe, o ana kategorinin
 * TÜM harcamasını kapsar (alt kategorili işlemler dahil) — `Transaction.categoryId`
 * her zaman ana kategoriyi taşıdığı için (bkz. CLAUDE.md Data model notu) ekstra
 * bir toplama adımına gerek yok.
 */
export function computeBudgetProgress(budgets: BudgetRow[], transactions: TransactionRow[]): BudgetWithProgress[] {
  const perCategory = new Map<string, number>();
  const perSubCategory = new Map<string, number>();

  for (const t of transactions) {
    if (!t.categoryId) continue;
    const signed = t.type === "EXPENSE" ? t.amount : -t.amount;
    perCategory.set(t.categoryId, (perCategory.get(t.categoryId) ?? 0) + signed);
    if (t.subCategoryId) {
      const key = `${t.categoryId}:${t.subCategoryId}`;
      perSubCategory.set(key, (perSubCategory.get(key) ?? 0) + signed);
    }
  }

  return budgets.map((b) => {
    const rawSpent = b.subCategoryId
      ? (perSubCategory.get(`${b.categoryId}:${b.subCategoryId}`) ?? 0)
      : (perCategory.get(b.categoryId) ?? 0);
    const spent = Math.max(rawSpent, 0);

    return {
      id: b.id,
      categoryId: b.categoryId,
      categoryName: b.category.name,
      categoryColor: b.category.color,
      subCategoryId: b.subCategoryId,
      subCategoryName: b.subCategory?.name ?? null,
      limitAmount: b.limitAmount,
      spent,
      remaining: b.limitAmount - spent,
      percent: b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0,
      exceeded: spent > b.limitAmount,
    };
  });
}

/**
 * Tüm bütçeler + verilen aydaki gerçek harcama ilerlemesi (spec §36). Tek
 * sorguda hesaplanır (spec §56, N+1 yerine): bütçeli kategorilerin o ayki
 * TÜM işlemleri çekilip `computeBudgetProgress`'e verilir.
 */
export async function listBudgetsWithProgress(year: number, month: number): Promise<BudgetWithProgress[]> {
  const budgets = await prisma.budget.findMany({
    include: { category: true, subCategory: true },
    orderBy: { category: { name: "asc" } },
  });
  if (budgets.length === 0) return [];

  const categoryIds = [...new Set(budgets.map((b) => b.categoryId))];

  const transactions = await prisma.transaction.findMany({
    where: {
      ...transactionMonthFilter(year, month),
      type: { in: ["EXPENSE", "REFUND"] },
      categoryId: { in: categoryIds },
    },
    select: { amount: true, type: true, categoryId: true, subCategoryId: true },
  });

  return computeBudgetProgress(budgets, transactions);
}
