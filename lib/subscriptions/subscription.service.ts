import type { Category, Subscription } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { addInterval, detectSubscriptions, type SubscriptionCandidate } from "./detect";

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

/**
 * `/transactions` sayfasının, her satırın "Abonelik" onay kutusunu doğru
 * başlangıç durumuyla göstermesi için tek seferde çektiği merchant seti
 * (N+1 sorgu yerine — spec §56).
 */
export async function listActiveConfirmedSubscriptionMerchants(): Promise<string[]> {
  const rows = await prisma.subscription.findMany({
    where: { confirmed: true, active: true },
    select: { merchant: true },
  });
  return rows.map((r) => r.merchant);
}

export type SetManualSubscriptionInput = {
  merchant: string;
  active: boolean;
  categoryId: string | null;
  amount: number; // kuruş
  date: Date;
};

/**
 * `/transactions` düzenleme diyaloğundaki "Abonelik olarak işaretle"
 * onay kutusu için: otomatik tespit (`detectSubscriptions`) beklemeden
 * kullanıcının doğrudan onayladığı bir abonelik oluşturur/günceller
 * (`confirmed: true`, `syncSubscriptions`'daki find-then-create/update
 * kalıbıyla aynı — `merchant` alanında DB seviyesinde unique yok). Kutunun
 * işareti kaldırılırsa kayıt SİLİNMEZ, `active: false` yapılır — diğer
 * abonelik pasifleştirme akışlarıyla (setSubscriptionActive) aynı, geri
 * alınabilir davranış.
 */
export async function setManualSubscription(input: SetManualSubscriptionInput): Promise<void> {
  const existing = await prisma.subscription.findFirst({ where: { merchant: input.merchant } });

  if (!input.active) {
    if (existing) await prisma.subscription.update({ where: { id: existing.id }, data: { active: false } });
    return;
  }

  const frequency = existing?.frequency ?? "MONTHLY";
  const data = {
    averageAmount: input.amount,
    frequency,
    lastChargeDate: input.date,
    nextExpectedDate: addInterval(input.date, frequency === "YEARLY" ? "YEARLY" : "MONTHLY"),
    categoryId: input.categoryId,
    active: true,
    confirmed: true,
  };

  if (existing) {
    await prisma.subscription.update({ where: { id: existing.id }, data });
  } else {
    await prisma.subscription.create({ data: { merchant: input.merchant, ...data } });
  }
}

/** Tahmini aylık sabit gider (spec §27) — yıllık abonelikler bu toplama dahil edilmez. */
export function getMonthlyRecurringTotal(items: { frequency: Subscription["frequency"]; amount: number }[]): number {
  return items.filter((i) => i.frequency !== "YEARLY").reduce((sum, i) => sum + i.amount, 0);
}

/**
 * Bir merchant listesinin, verilen ay için GERÇEK toplam harcaması (kullanıcı
 * isteği: faturalar/abonelikler ay ay farklı tutarlarda gelebiliyor — fatura
 * zammı ya da değişken tutarlı faturalar (elektrik/su/doğalgaz gibi) — bu
 * yüzden `Subscription.averageAmount` tek başına yanıltıcı, gerçek o ayki
 * işlem tutarı kullanılmalı). Aynı merchant'a o ay birden fazla işlem
 * düşerse (nadir ama mümkün) toplanır.
 */
async function getActualMonthlyAmounts(
  merchants: string[],
  year: number,
  month: number,
): Promise<Map<string, number>> {
  if (merchants.length === 0) return new Map();

  const rows = await prisma.transaction.groupBy({
    by: ["normalizedMerchant"],
    where: {
      normalizedMerchant: { in: merchants },
      type: "EXPENSE",
      date: { gte: new Date(Date.UTC(year, month - 1, 1)), lt: new Date(Date.UTC(year, month, 1)) },
    },
    _sum: { amount: true },
  });

  return new Map(rows.map((r) => [r.normalizedMerchant, r._sum.amount ?? 0]));
}

export type SubscriptionWithCurrentAmount = SubscriptionWithCategory & {
  currentAmount: number; // kuruş — o ayki gerçek işlem tutarı, yoksa averageAmount'a düşer
  isEstimated: boolean; // true: o ay için henüz gerçek işlem yok, averageAmount tahmini olarak kullanıldı
};

/**
 * Her abonelik için verilen aydaki GERÇEK tutarı ekler (bkz.
 * `getActualMonthlyAmounts`). O ay için henüz bir işlem yoksa (fatura henüz
 * gelmedi/işlenmedi) `averageAmount` tahmini olarak kullanılır ve
 * `isEstimated: true` ile işaretlenir — "asla sessizce varsayma" ilkesi
 * (spec §70 Kural 7), UI bunu ayırt edip gösterebilsin diye.
 */
export async function withCurrentMonthAmounts(
  subscriptions: SubscriptionWithCategory[],
  year: number,
  month: number,
): Promise<SubscriptionWithCurrentAmount[]> {
  const actualByMerchant = await getActualMonthlyAmounts(
    subscriptions.map((s) => s.merchant),
    year,
    month,
  );

  return subscriptions.map((s) => {
    const actual = actualByMerchant.get(s.merchant);
    return { ...s, currentAmount: actual ?? s.averageAmount, isEstimated: actual === undefined };
  });
}
