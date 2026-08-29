import { prisma } from "@/lib/db/client";
import { transactionMonthFilter } from "@/lib/db/transaction.service";

export type CategoryBreakdownItem = {
  categoryId: string | null;
  name: string;
  color: string;
  amount: number; // kuruş, net (EXPENSE - REFUND)
};

const UNCATEGORIZED_COLOR = "#94a3b8";

/**
 * Seçili ayda ana kategoriye göre net harcama dağılımı (spec §30: donut/pie
 * chart, tutarlı kategori renkleri). `categoryId` her zaman Transaction'ın
 * ANA kategorisini gösterir (bkz. CLAUDE.md — alt kategori ayrı bir alan),
 * bu yüzden ekstra bir üst-kategoriye toplama adımına gerek yok. Ay eşleşmesi
 * `transactionMonthFilter` ile yapılır (spec §53 — taksitli ekstre satırları
 * için ekstre dönemi esas alınır, bkz. transaction.service.ts).
 */
export async function getCategoryBreakdown(year: number, month: number): Promise<CategoryBreakdownItem[]> {
  const transactions = await prisma.transaction.findMany({
    where: { ...transactionMonthFilter(year, month), type: { in: ["EXPENSE", "REFUND"] } },
    select: {
      amount: true,
      type: true,
      categoryId: true,
      category: { select: { name: true, color: true } },
    },
  });

  const totals = new Map<string, CategoryBreakdownItem>();

  for (const t of transactions) {
    const key = t.categoryId ?? "uncategorized";
    const signedAmount = t.type === "EXPENSE" ? t.amount : -t.amount;
    const existing = totals.get(key);
    if (existing) {
      existing.amount += signedAmount;
    } else {
      totals.set(key, {
        categoryId: t.categoryId,
        name: t.category?.name ?? "Kategori seçilmedi",
        color: t.category?.color ?? UNCATEGORIZED_COLOR,
        amount: signedAmount,
      });
    }
  }

  return [...totals.values()].filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
}

/**
 * Seçili ayda, HER ana kategori için alt kategori bazlı net dağılım — tek
 * sorguda tüm ana kategoriler için birden hesaplanır (spec §56: N+1 yerine
 * tek gruplu sorgu). Dashboard'da bir ana kategori seçildiğinde onun alt
 * kırılımını göstermek için kullanılır. Alt kategorisi olmayan (`subCategoryId`
 * null) işlemler, ana kategorinin kendi rengiyle "(alt kategori yok)" adında
 * ayrı bir dilim olarak görünür.
 */
export async function getSubCategoryBreakdowns(
  year: number,
  month: number,
): Promise<Record<string, CategoryBreakdownItem[]>> {
  const transactions = await prisma.transaction.findMany({
    where: { ...transactionMonthFilter(year, month), type: { in: ["EXPENSE", "REFUND"] }, categoryId: { not: null } },
    select: {
      amount: true,
      type: true,
      categoryId: true,
      subCategoryId: true,
      category: { select: { name: true, color: true } },
      subCategory: { select: { name: true, color: true } },
    },
  });

  const byParent = new Map<string, Map<string, CategoryBreakdownItem>>();

  for (const t of transactions) {
    if (!t.categoryId) continue;
    const buckets = byParent.get(t.categoryId) ?? new Map<string, CategoryBreakdownItem>();
    const key = t.subCategoryId ?? "__none__";
    const signedAmount = t.type === "EXPENSE" ? t.amount : -t.amount;

    const existing = buckets.get(key);
    if (existing) {
      existing.amount += signedAmount;
    } else {
      buckets.set(key, {
        categoryId: t.subCategoryId,
        name: t.subCategory?.name ?? `${t.category?.name ?? "Diğer"} (alt kategori yok)`,
        color: t.subCategory?.color ?? t.category?.color ?? UNCATEGORIZED_COLOR,
        amount: signedAmount,
      });
    }
    byParent.set(t.categoryId, buckets);
  }

  const result: Record<string, CategoryBreakdownItem[]> = {};
  for (const [parentId, buckets] of byParent) {
    result[parentId] = [...buckets.values()].filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount);
  }
  return result;
}
