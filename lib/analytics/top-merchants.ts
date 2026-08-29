import { prisma } from "@/lib/db/client";
import { transactionMonthFilter } from "@/lib/db/transaction.service";

export type TopMerchant = { merchant: string; amount: number; count: number };

/**
 * Seçili ayda en çok harcama yapılan merchant'lar (spec §55), net (EXPENSE-REFUND).
 * Banka ücreti/faiz satırları (alt kategori "Bankacılık") hariç tutulur — bunlar
 * gerçek bir merchant değil, bakiyeye göre değişen tahakkuklardır; aynı dışlama
 * `lib/subscriptions/subscription.service.ts`'in aday sorgusunda da kullanılıyor.
 */
export async function getTopMerchants(year: number, month: number, limit = 10): Promise<TopMerchant[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      ...transactionMonthFilter(year, month),
      type: { in: ["EXPENSE", "REFUND"] },
      NOT: { subCategory: { name: "Bankacılık" } },
    },
    select: { amount: true, type: true, normalizedMerchant: true },
  });

  const totals = new Map<string, TopMerchant>();
  for (const t of transactions) {
    const signed = t.type === "EXPENSE" ? t.amount : -t.amount;
    const existing = totals.get(t.normalizedMerchant);
    if (existing) {
      existing.amount += signed;
      existing.count += 1;
    } else {
      totals.set(t.normalizedMerchant, { merchant: t.normalizedMerchant, amount: signed, count: 1 });
    }
  }

  return [...totals.values()]
    .filter((m) => m.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}
