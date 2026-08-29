import type { Category, Subscription } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { detectSubscriptions, type SubscriptionCandidate } from "./detect";

/**
 * Abonelik tespiti için aday işlemler: taksitli olmayan gider işlemleri.
 * Finans/Bankacılık alt kategorisi (faiz/KKDF/BSMV — bkz.
 * lib/categorization/pattern-rules.ts'nin isBankFee kuralı) kasıtlı olarak
 * dışlanır — bunlar teknik olarak her ay tekrar etse de kullanıcı için bir
 * "abonelik" değildir. İsimle eşleştirme, engine.ts'teki
 * resolveCategoryByName ile aynı kalıbı izler: kullanıcı bu alt kategoriyi
 * yeniden adlandırır/silerse filtre sessizce devre dışı kalır (hata fırlatmaz).
 */
async function getSubscriptionCandidateRows() {
  return prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      installmentTotal: null,
      NOT: { subCategory: { name: "Bankacılık" } },
    },
    select: { id: true, date: true, normalizedMerchant: true, amount: true, categoryId: true },
  });
}

export async function getSubscriptionCandidates(): Promise<SubscriptionCandidate[]> {
  const rows = await getSubscriptionCandidateRows();
  return detectSubscriptions(rows);
}

/**
 * Tespit edilen adayları `Subscription` tablosuyla eşitler. Yeni bir merchant
 * bulunursa `confirmed: false` ile oluşturulur (spec §25: "abonelik otomatik
 * olarak kesin kabul edilmemelidir"). Zaten var olan kayıtlarda türetilmiş
 * alanlar (averageAmount/frequency/lastChargeDate/nextExpectedDate/
 * categoryId) her zaman güncel tutulur, ama kullanıcının `active`/`confirmed`
 * seçimine hiç dokunulmaz. `merchant` alanında DB seviyesinde `@@unique` yok
 * (yalnızca örtük eşitlik kontrolü) — bkz. merchant-rule.service.ts'teki aynı
 * find-then-create/update kalıbı.
 *
 * Artık desene uymayan eski kayıtlar SİLİNMEZ (kullanıcı zaten onaylamış
 * olabilir, geçmiş veri kaybolmasın) — yalnızca bir sonraki senkronda
 * güncellenmeyi bırakırlar.
 */
export async function syncSubscriptions(): Promise<void> {
  const candidates = await getSubscriptionCandidates();
  const existing = await prisma.subscription.findMany({ select: { id: true, merchant: true } });
  const existingByMerchant = new Map(existing.map((s) => [s.merchant, s.id]));

  for (const candidate of candidates) {
    const existingId = existingByMerchant.get(candidate.merchant);
    const data = {
      averageAmount: candidate.averageAmount,
      frequency: candidate.frequency,
      lastChargeDate: candidate.lastChargeDate,
      nextExpectedDate: candidate.nextExpectedDate,
      categoryId: candidate.categoryId,
    };

    if (existingId) {
      await prisma.subscription.update({ where: { id: existingId }, data });
    } else {
      await prisma.subscription.create({ data: { merchant: candidate.merchant, ...data } });
    }
  }
}

export type SubscriptionWithCategory = Subscription & { category: Category | null };

export function listPendingSubscriptions(): Promise<SubscriptionWithCategory[]> {
  return prisma.subscription.findMany({
    where: { confirmed: false, active: true },
    include: { category: true },
    orderBy: { averageAmount: "desc" },
  });
}

export function listConfirmedSubscriptions(): Promise<SubscriptionWithCategory[]> {
  return prisma.subscription.findMany({
    where: { confirmed: true, active: true },
    include: { category: true },
    orderBy: { averageAmount: "desc" },
  });
}

export function listInactiveSubscriptions(): Promise<SubscriptionWithCategory[]> {
  return prisma.subscription.findMany({
    where: { active: false },
    include: { category: true },
    orderBy: { merchant: "asc" },
  });
}

export function confirmSubscription(id: string) {
  return prisma.subscription.update({ where: { id }, data: { confirmed: true } });
}

export function setSubscriptionActive(id: string, active: boolean) {
  return prisma.subscription.update({ where: { id }, data: { active } });
}

/** Tahmini aylık sabit gider (spec §27) — yıllık abonelikler bu toplama dahil edilmez. */
export function getMonthlyRecurringTotal(subscriptions: Subscription[]): number {
  return subscriptions.filter((s) => s.frequency !== "YEARLY").reduce((sum, s) => sum + s.averageAmount, 0);
}
