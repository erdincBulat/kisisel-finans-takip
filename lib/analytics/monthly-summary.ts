import { prisma } from "@/lib/db/client";
import { getEffectiveMonth, transactionMonthFilter } from "@/lib/db/transaction.service";

export type MonthlySummary = {
  totalIncome: number; // kuruş
  totalExpense: number; // kuruş
  net: number; // kuruş
  transactionCount: number;
};

/**
 * Seçili ayın gelir/gider/net özeti (spec §28/§51/§52):
 * - Harcama: EXPENSE toplamı - REFUND toplamı. PAYMENT hariç (kredi kartı borç
 *   ödemesidir, harcama değildir — bkz. CLAUDE.md TransactionType.PAYMENT notu).
 * - Gelir: Income tablosu + (varsa) INCOME tipli transaction'lar.
 * - Ay, `getEffectiveMonth`'a göre belirlenir (bkz. lib/db/transaction.service.ts)
 *   — normal işlemlerde bu işlem tarihidir, ekstre kaynaklı taksitli işlemlerde
 *   ekstrenin ait olduğu dönemdir (spec §53).
 */
export async function getMonthlySummary(year: number, month: number): Promise<MonthlySummary> {
  const monthFilter = transactionMonthFilter(year, month);

  const [expenseAgg, refundAgg, incomeTxAgg, incomeAgg, transactionCount] = await Promise.all([
    prisma.transaction.aggregate({ where: { ...monthFilter, type: "EXPENSE" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...monthFilter, type: "REFUND" }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { ...monthFilter, type: "INCOME" }, _sum: { amount: true } }),
    prisma.income.aggregate({
      where: { date: { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) } },
      _sum: { amount: true },
    }),
    prisma.transaction.count({ where: monthFilter }),
  ]);

  const totalExpense = (expenseAgg._sum.amount ?? 0) - (refundAgg._sum.amount ?? 0);
  const totalIncome = (incomeAgg._sum.amount ?? 0) + (incomeTxAgg._sum.amount ?? 0);

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    transactionCount,
  };
}

export type MonthPoint = { year: number; month: number; totalExpense: number; totalIncome: number };

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

/** `endYear/endMonth` dahil olmak üzere geriye doğru `count` ayı (eskiden yeniye sıralı) listeler. */
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
 * Son `count` ayın harcama/gelir toplamları (spec §31 zaman grafiği).
 * İki ayrı sorgu atılır: (1) normal/manuel işlemler tarih aralığına göre,
 * (2) ekstre kaynaklı taksitli işlemler TÜMÜ (az sayıda oldukları için tek
 * seferde çekilip `getEffectiveMonth`'a göre kovaya dağıtılır) — çünkü
 * bunların `date` alanı aralığın dışında bir tarih taşıyabilir (bkz.
 * transaction.service.ts'teki not). `count` ay için ayrı ayrı sorgu atmak
 * yerine (spec §56: "aggregate sorgular tercih edilmelidir").
 */
export async function getMonthlyTrend(endYear: number, endMonth: number, count: number): Promise<MonthPoint[]> {
  const months = buildMonthList(endYear, endMonth, count);
  const rangeStart = new Date(Date.UTC(months[0].year, months[0].month - 1, 1));
  const rangeEnd = new Date(Date.UTC(endYear, endMonth, 1));

  const buckets = new Map<string, { expense: number; income: number }>();
  for (const m of months) buckets.set(monthKey(m.year, m.month), { expense: 0, income: 0 });

  const [regularTransactions, installmentTransactions, incomes] = await Promise.all([
    prisma.transaction.findMany({
      where: {
        date: { gte: rangeStart, lt: rangeEnd },
        type: { in: ["EXPENSE", "REFUND", "INCOME"] },
        OR: [{ installmentTotal: null }, { source: "MANUAL" }],
      },
      select: { date: true, amount: true, type: true },
    }),
    prisma.transaction.findMany({
      where: { installmentTotal: { not: null }, source: "STATEMENT", type: { in: ["EXPENSE", "REFUND", "INCOME"] } },
      select: {
        date: true,
        amount: true,
        type: true,
        source: true,
        installmentTotal: true,
        statement: { select: { year: true, month: true } },
      },
    }),
    prisma.income.findMany({ where: { date: { gte: rangeStart, lt: rangeEnd } }, select: { date: true, amount: true } }),
  ]);

  function apply(amount: number, type: string, year: number, month: number) {
    const bucket = buckets.get(monthKey(year, month));
    if (!bucket) return;
    if (type === "EXPENSE") bucket.expense += amount;
    else if (type === "REFUND") bucket.expense -= amount;
    else if (type === "INCOME") bucket.income += amount;
  }

  for (const t of regularTransactions) {
    apply(t.amount, t.type, t.date.getUTCFullYear(), t.date.getUTCMonth() + 1);
  }
  for (const t of installmentTransactions) {
    const { year, month } = getEffectiveMonth(t);
    apply(t.amount, t.type, year, month);
  }
  for (const i of incomes) {
    const bucket = buckets.get(monthKey(i.date.getUTCFullYear(), i.date.getUTCMonth() + 1));
    if (bucket) bucket.income += i.amount;
  }

  return months.map((m) => {
    const bucket = buckets.get(monthKey(m.year, m.month))!;
    return { year: m.year, month: m.month, totalExpense: bucket.expense, totalIncome: bucket.income };
  });
}

/** Veri bulunan en güncel dönem — dashboard varsayılan ay seçimi için. En son yüklenen ekstrenin dönemi esas alınır. */
export async function getLatestDataMonth(): Promise<{ year: number; month: number } | null> {
  const latestStatement = await prisma.statement.findFirst({
    orderBy: [{ year: "desc" }, { month: "desc" }],
    select: { year: true, month: true },
  });
  if (latestStatement) return latestStatement;

  const latestTransaction = await prisma.transaction.findFirst({ orderBy: { date: "desc" }, select: { date: true } });
  if (!latestTransaction) return null;
  return { year: latestTransaction.date.getUTCFullYear(), month: latestTransaction.date.getUTCMonth() + 1 };
}
