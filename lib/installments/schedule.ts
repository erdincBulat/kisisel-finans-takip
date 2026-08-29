import type { TransactionSource } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { getEffectiveMonth } from "@/lib/db/transaction.service";

export type InstallmentOccurrenceStatus = "REAL" | "MISSING" | "PROJECTED";

export type InstallmentOccurrence = {
  installmentCurrent: number;
  year: number;
  month: number;
  amount: number; // kuruş
  status: InstallmentOccurrenceStatus;
  transactionId: string | null; // REAL değilse null
};

export type InstallmentPlan = {
  planKey: string;
  merchant: string;
  description: string;
  purchaseDate: Date;
  installmentAmount: number; // kuruş, taksit başına
  totalInstallments: number;
  totalAmount: number; // kuruş, installmentAmount * totalInstallments
  latestKnownInstallment: number;
  remainingInstallments: number;
  remainingAmount: number; // kuruş
  status: "ACTIVE" | "COMPLETED";
  occurrences: InstallmentOccurrence[]; // installmentCurrent'a göre artan sırayla, 1..totalInstallments tümü
};

function addMonths(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export type InstallmentRow = {
  id: string;
  date: Date;
  description: string;
  normalizedMerchant: string;
  amount: number;
  source: TransactionSource;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  statement: { year: number; month: number } | null;
};

/**
 * Aynı satın almaya ait taksit satırlarını gruplamak için kullanılan anahtar.
 * `date` burada ORİJİNAL satın alma tarihidir ve ekstre kaynaklı taksitlerde
 * SABİTTİR (her taksit satırında aynı basılıyor — bkz. transaction.service.ts
 * `getEffectiveMonth` notu), bu yüzden ironik biçimde tam da bu sabitlik onu
 * güvenilir bir gruplama anahtarı yapıyor.
 */
function planKeyOf(t: Pick<InstallmentRow, "normalizedMerchant" | "date" | "amount" | "installmentTotal">) {
  return [t.normalizedMerchant, t.date.toISOString().slice(0, 10), t.amount, t.installmentTotal].join("|");
}

/**
 * Tüm taksitli işlemleri satın alma bazında planlara gruplar ve her plan için
 * 1'den totalInstallments'a kadar TÜM ayları (gerçek/eksik/projeksiyon)
 * üretir (spec §22/§23/§53). Saf/senkron fonksiyon — DB'ye dokunmaz, testte
 * doğrudan çağrılabilir (bkz. lib/categorization/engine.ts'teki suggestCategory
 * ile aynı ayrım: DB'den veri çekme kısmı ayrı, hesaplama saf).
 *
 * Not: `Installment` tablosu bilinçli olarak KULLANILMIYOR — her satırın
 * installmentCurrent/Total/amount alanları zaten yeterli, tabloyu ayrıca
 * doldurmak senkronizasyonu bozulabilecek bir önbellek yaratırdı (yeni bir
 * ekstre içe aktarıldıkça plan yeniden hesaplanmalı). Bu yüzden her şey
 * Transaction'dan anlık hesaplanıyor (spec §56: gereksiz complexity yok).
 */
export function buildInstallmentPlans(rows: InstallmentRow[]): InstallmentPlan[] {
  const groups = new Map<string, InstallmentRow[]>();
  for (const row of rows) {
    if (row.installmentCurrent == null || row.installmentTotal == null) continue;
    const key = planKeyOf(row);
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const plans: InstallmentPlan[] = [];

  for (const [key, group] of groups) {
    const sorted = [...group].sort((a, b) => a.installmentCurrent! - b.installmentCurrent!);
    const first = sorted[0];
    const totalInstallments = first.installmentTotal!;
    const installmentAmount = first.amount;

    const realByNumber = new Map<number, InstallmentRow>();
    for (const row of sorted) realByNumber.set(row.installmentCurrent!, row);

    const latestKnownInstallment = Math.max(...sorted.map((r) => r.installmentCurrent!));
    const latestRow = realByNumber.get(latestKnownInstallment)!;
    const anchorMonth = getEffectiveMonth(latestRow);

    const occurrences: InstallmentOccurrence[] = [];
    for (let n = 1; n <= totalInstallments; n++) {
      const realRow = realByNumber.get(n);
      if (realRow) {
        const month = getEffectiveMonth(realRow);
        occurrences.push({
          installmentCurrent: n,
          year: month.year,
          month: month.month,
          amount: realRow.amount,
          status: "REAL",
          transactionId: realRow.id,
        });
      } else if (n <= latestKnownInstallment) {
        // Ara ayda bir ekstre hiç yüklenmemiş — komşu bilinen taksitten geriye
        // doğru enterpolasyon yapılır (aylık taksit döngüsü sabit varsayılır).
        const interpolated = addMonths(anchorMonth.year, anchorMonth.month, n - latestKnownInstallment);
        occurrences.push({
          installmentCurrent: n,
          year: interpolated.year,
          month: interpolated.month,
          amount: installmentAmount,
          status: "MISSING",
          transactionId: null,
        });
      } else {
        const projected = addMonths(anchorMonth.year, anchorMonth.month, n - latestKnownInstallment);
        occurrences.push({
          installmentCurrent: n,
          year: projected.year,
          month: projected.month,
          amount: installmentAmount,
          status: "PROJECTED",
          transactionId: null,
        });
      }
    }

    const remainingInstallments = totalInstallments - latestKnownInstallment;

    plans.push({
      planKey: key,
      merchant: first.normalizedMerchant,
      description: first.description,
      purchaseDate: first.date,
      installmentAmount,
      totalInstallments,
      totalAmount: installmentAmount * totalInstallments,
      latestKnownInstallment,
      remainingInstallments,
      remainingAmount: installmentAmount * remainingInstallments,
      status: remainingInstallments > 0 ? "ACTIVE" : "COMPLETED",
      occurrences,
    });
  }

  return plans.sort((a, b) => b.purchaseDate.getTime() - a.purchaseDate.getTime());
}

export async function getInstallmentPlans(): Promise<InstallmentPlan[]> {
  const rows = await prisma.transaction.findMany({
    where: { installmentTotal: { not: null } },
    select: {
      id: true,
      date: true,
      description: true,
      normalizedMerchant: true,
      amount: true,
      source: true,
      installmentCurrent: true,
      installmentTotal: true,
      statement: { select: { year: true, month: true } },
    },
  });

  return buildInstallmentPlans(rows);
}
