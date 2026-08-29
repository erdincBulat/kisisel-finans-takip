import { findKnownMerchant } from "./known-merchants";
import { trLower } from "./text";

/**
 * Ödeme kuruluşu / aracı önekleri — gerçek ekstrelerden (Mart-Ağustos 2026,
 * 6 aylık veri) çıkarılmış kalıplar. Bunlar gerçek merchant değil, işlemi
 * yönlendiren aracı kuruluşu temsil eder; asıl merchant adı önekten SONRA gelir.
 * `PAYTR/` (boşluksuz), `PAYTR ÖD/`'den ayrı bir gerçek varyant olarak gözlendi.
 */
const KNOWN_PREFIXES = ["GOOGLE *", "IYZICO/", "PAYTR ÖD/", "PAYTR/", "HEPSIPAY/", "N KOLAY ODEM/"];

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** Bilinen bir ödeme aracısı öneki varsa temizler, yoksa metni olduğu gibi (trim'lenmiş) döner. */
export function stripKnownPrefixes(description: string): string {
  const trimmed = description.trim();
  const haystack = trLower(trimmed);
  for (const prefix of KNOWN_PREFIXES) {
    if (haystack.startsWith(trLower(prefix))) {
      return trimmed.slice(prefix.length).trim();
    }
  }
  return trimmed;
}

/**
 * Ham işlem açıklamasını standart bir merchant adına çevirir (spec §10):
 * ödeme aracısı önekini temizler, boşlukları sadeleştirir, bilinen bir
 * merchant eşleşirse onun kanonik adını kullanır. DB'ye hiç erişmez — saf ve
 * senkron; MerchantRule eşleştirmesi `lib/categorization/engine.ts`'in işi.
 */
export function normalizeMerchant(description: string): string {
  const stripped = stripKnownPrefixes(description);
  const cleaned = collapseWhitespace(stripped);
  const known = findKnownMerchant(cleaned);
  return known?.normalizedName ?? cleaned;
}
