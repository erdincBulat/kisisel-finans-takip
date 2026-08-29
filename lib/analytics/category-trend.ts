import { prisma } from "@/lib/db/client";
import { getEffectiveMonth } from "@/lib/db/transaction.service";

export type CategoryTrendPoint = { year: number; month: number; amount: number };
export type CategoryTrendSeries = { categoryId: string; name: string; color: string; points: CategoryTrendPoint[] };

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

function buildMonthList(endYear: number, endMonth: number, count: number) {
  const months: { year: number; month: number }[] = [];
  let y = endYear;
  let m = endMonth;
  for (let i = 0; i < count; i++) {
    months.unshift({ year: y, month: m });
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return months;
}

/**
 * Son `count` ayda en çok harcanan `topN` ana kategorinin ay bazlı net
 * (EXPENSE-REFUND) harcama serisi (spec §55 "Kategori Dağılımı" + Faz 11
 * "kategori trend") — dashboard'un `getCategoryBreakdown`'ından farkı, TEK
 * ay değil zaman serisi: hangi kategorinin büyüdüğünü/küçüldüğünü göstermek
 * için. `getMonthlyTrend` ile aynı iki-sorgulu desen (spec §53/§56): normal
 * işlemler tarih aralığına göre, ekstre kaynaklı taksitli işlemler TÜMÜ
 * çekilip `getEffectiveMonth`'a göre kovaya dağıtılır.
 */
export async function getCategoryTrend(
  endYear: number,
  endMonth: number,
  count: number,
  topN = 6,
): Promise<CategoryTrendSeries[]> {
  const months = buildMonthList(endYear, endMonth, count);
  const rangeStart = new Date(Date.UTC(months[0].year, months[0].month - 1, 1));
  const rangeEnd = new Date(Date.UTC(endYear, endMonth, 1));

  const [regular, installment] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: { gte: rangeStart, lt: rangeEnd },
        type: { in: ["EXPENSE", "REFUND"] },
        OR: [{ installmentTotal: null }, { source: "MANUAL" }],
      },
      select: {
        date: true,
        amount: true,
        type: true,
        categoryId: true,
        category: { select: { name: true, color: true } },
      },
    }),
    prisma.transaction.findMany({
      where: { installmentTotal: { not: null }, source: "STATEMENT", type: { in: ["EXPENSE", "REFUND"] } },
      select: {
        date: true,
        amount: true,
        type: true,
        source: true,
        installmentTotal: true,
        categoryId: true,
        category: { select: { name: true, color: true } },
        statement: { select: { year: true, month: true } },
      },
    }),
  ]);

  const perCategoryMonthly = new Map<string, Map<string, number>>();
  const overallTotals = new Map<string, number>();
  const categoryMeta = new Map<string, { name: string; color: string }>();

  function apply(
    categoryId: string | null,
    meta: { name: string; color: string } | null,
    amount: number,
    type: string,
    year: number,
    month: number,
  ) {
    if (!categoryId) return;
    const signed = type === "EXPENSE" ? amount : -amount;
    if (meta) categoryMeta.set(categoryId, meta);

    const monthly = perCategoryMonthly.get(categoryId) ?? new Map<string, number>();
    const key = monthKey(year, month);
    monthly.set(key, (monthly.get(key) ?? 0) + signed);
    perCategoryMonthly.set(categoryId, monthly);

    overallTotals.set(categoryId, (overallTotals.get(categoryId) ?? 0) + signed);
  }

  for (const t of regular) {
    apply(t.categoryId, t.category, t.amount, t.type, t.date.getUTCFullYear(), t.date.getUTCMonth() + 1);
  }
  for (const t of installment) {
    const { year, month } = getEffectiveMonth(t);
    apply(t.categoryId, t.category, t.amount, t.type, year, month);
  }

  const topCategoryIds = [...overallTotals.entries()]
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id]) => id);

  return topCategoryIds.map((categoryId) => {
    const meta = categoryMeta.get(categoryId)!;
    const monthly = perCategoryMonthly.get(categoryId)!;
    return {
      categoryId,
      name: meta.name,
      color: meta.color,
      points: months.map((m) => ({
        year: m.year,
        month: m.month,
        amount: Math.max(monthly.get(monthKey(m.year, m.month)) ?? 0, 0),
      })),
    };
  });
}
