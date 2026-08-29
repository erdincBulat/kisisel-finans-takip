import { getInstallmentBurdenByMonth } from "@/lib/installments/calculations";
import {
  listConfirmedSubscriptions,
  getMonthlyRecurringTotal,
  withCurrentMonthAmounts,
} from "@/lib/subscriptions/subscription.service";

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
  items: { merchant: string; amount: number; isEstimated: boolean }[];
  monthlyTotal: number; // kuruş
  estimatedCount: number; // o ay için henüz gerçek işlemi olmayan (tahmini) abonelik sayısı
};

/**
 * Onaylanmış aktif abonelikler (spec §27) — abonelik tespit algoritması
 * lib/subscriptions/detect.ts'te (spec §54). Tutarlar `averageAmount`
 * (sabit, tarihsel ortalama) DEĞİL, verilen ayın GERÇEK işlem tutarıdır —
 * kullanıcı isteği: faturalar/abonelikler ay ay değişebiliyor (fatura
 * zammı, değişken tutarlı faturalar), tek bir sabit sayı yanıltıcı.
 */
export async function getSubscriptionsSummary(year: number, month: number): Promise<SubscriptionsSummary> {
  const subscriptions = await listConfirmedSubscriptions();
  const withAmounts = await withCurrentMonthAmounts(subscriptions, year, month);

  return {
    items: withAmounts.map((s) => ({ merchant: s.merchant, amount: s.currentAmount, isEstimated: s.isEstimated })),
    monthlyTotal: getMonthlyRecurringTotal(withAmounts.map((s) => ({ frequency: s.frequency, amount: s.currentAmount }))),
    estimatedCount: withAmounts.filter((s) => s.isEstimated).length,
  };
}
