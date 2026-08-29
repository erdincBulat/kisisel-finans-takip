import { getInstallmentPlans, type InstallmentPlan } from "./schedule";

export type MonthlyInstallmentBurden = { year: number; month: number; total: number; count: number };

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

/**
 * `fromYear/fromMonth` dahil olmak üzere `count` ay için taksit yükü
 * projeksiyonu (spec §24: "Gelecek Taksitler"). Yalnızca REAL ve PROJECTED
 * satırlar toplanır — MISSING (yüklenmemiş ekstre dönemine denk gelen,
 * enterpolasyonla tahmini ay atanmış) satırlar zaten geçmişte kaldığı için
 * gelecek yük hesabına dahil edilmez. Saf fonksiyon — testte doğrudan
 * çağrılabilir (bkz. schedule.ts'teki buildInstallmentPlans ile aynı ayrım).
 */
export function buildInstallmentBurdenByMonth(
  plans: InstallmentPlan[],
  fromYear: number,
  fromMonth: number,
  count: number,
): MonthlyInstallmentBurden[] {
  const months: MonthlyInstallmentBurden[] = [];
  let y = fromYear;
  let m = fromMonth;
  for (let i = 0; i < count; i++) {
    months.push({ year: y, month: m, total: 0, count: 0 });
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }

  const index = new Map(months.map((bucket) => [monthKey(bucket.year, bucket.month), bucket]));

  for (const plan of plans) {
    for (const occ of plan.occurrences) {
      if (occ.status === "MISSING") continue;
      const bucket = index.get(monthKey(occ.year, occ.month));
      if (bucket) {
        bucket.total += occ.amount;
        bucket.count += 1;
      }
    }
  }

  return months;
}

export function getActivePlans(plans: InstallmentPlan[]): InstallmentPlan[] {
  return plans.filter((p) => p.status === "ACTIVE");
}

export function getCompletedPlans(plans: InstallmentPlan[]): InstallmentPlan[] {
  return plans.filter((p) => p.status === "COMPLETED");
}

export function getTotalRemainingDebt(plans: InstallmentPlan[]): number {
  return plans.reduce((sum, p) => sum + p.remainingAmount, 0);
}

export async function getInstallmentBurdenByMonth(
  fromYear: number,
  fromMonth: number,
  count: number,
): Promise<MonthlyInstallmentBurden[]> {
  const plans = await getInstallmentPlans();
  return buildInstallmentBurdenByMonth(plans, fromYear, fromMonth, count);
}
