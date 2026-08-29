/**
 * Tüm para hesaplamaları kuruş (integer) cinsinden yapılır. Bu dosya dışında
 * hiçbir yerde ham Float aritmetiği ile TL tutarı toplanmamalı/çıkarılmamalı
 * (spec §50 — 0.1 + 0.2 !== 0.3 sınıfı hatalardan kaçınmak için).
 */

/** "1.250,50" veya "1250.50" gibi Türkçe/ham sayısal metni kuruşa çevirir. */
export function parseTLToKurus(raw: string): number {
  const normalized = raw
    .trim()
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    throw new Error(`Geçersiz tutar: "${raw}"`);
  }

  return Math.round(value * 100);
}

/** Kuruşu TL'ye çevirir (float — sadece görüntüleme/hesap dışı amaçlarla kullanılmalı). */
export function kurusToTL(kurus: number): number {
  return kurus / 100;
}

const formatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Kuruş değerini "₺1.250,50" formatında gösterir. */
export function formatKurus(kurus: number): string {
  return formatter.format(kurusToTL(kurus));
}

/** Kuruşu form input alanlarının `defaultValue`'su için "1250,50" biçiminde döndürür (₺ sembolü/binlik ayraç yok — `parseTLToKurus` bunu geri okuyabilir). */
export function kurusToTLInput(kurus: number): string {
  return kurusToTL(kurus).toFixed(2).replace(".", ",");
}
