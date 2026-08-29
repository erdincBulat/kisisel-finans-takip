import { getInstallmentBurdenByMonth } from "@/lib/installments/calculations";
import { listConfirmedSubscriptions, getMonthlyRecurringTotal } from "@/lib/subscriptions/subscription.service";

export type UpcomingInstallmentsSummary = {
  nextMonthTotal: number; // kuruş
  activeCount: number;
};

/** Dashboard'un "Gelecek Taksitler" kartı (spec §24) — Faz 8'in tam projeksiyon kütüphanesi (lib/installments/) kullanılır. */
export async function getUpcomingInstallmentsSummary(year: number, month: number): Promise<UpcomingInstallmentsSummary> {
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const [burden] = await getInstallmentBurdenByMonth(next.year, next.month, 1);

  return { nextMonthTotal: burden.total, activeCount: burden.count };
}

export type SubscriptionsSummary = {
  items: { merchant: string; amount: number }[];
  monthlyTotal: number; // kuruş
};

/** Onaylanmış aktif abonelikler (spec §27) — abonelik tespit algoritması lib/subscriptions/detect.ts'te (spec §54). */
export async function getSubscriptionsSummary(): Promise<SubscriptionsSummary> {
  const subscriptions = await listConfirmedSubscriptions();

  return {
    items: subscriptions.map((s) => ({ merchant: s.merchant, amount: s.averageAmount })),
    monthlyTotal: getMonthlyRecurringTotal(subscriptions),
  };
}
