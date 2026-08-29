import { getMonthlySummary } from "./monthly-summary";

export type MonthComparison = {
  currentExpense: number; // kuruş
  previousExpense: number; // kuruş
  changePercent: number | null; // önceki ayda harcama yoksa null (0'a bölme yok)
};

function previousMonth(year: number, month: number) {
  return month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
}

/** Seçili ayı bir önceki ayla karşılaştırır (spec §29). */
export async function getMonthComparison(year: number, month: number): Promise<MonthComparison> {
  const prev = previousMonth(year, month);
  const [current, previous] = await Promise.all([
    getMonthlySummary(year, month),
    getMonthlySummary(prev.year, prev.month),
  ]);

  const changePercent =
    previous.totalExpense > 0
      ? ((current.totalExpense - previous.totalExpense) / previous.totalExpense) * 100
      : null;

  return {
    currentExpense: current.totalExpense,
    previousExpense: previous.totalExpense,
    changePercent,
  };
}
