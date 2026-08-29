import { matchFold } from "./text";

export type KnownMerchantMatch = {
  normalizedName: string;
  categoryName?: string;
  subCategoryName?: string;
};

type KnownMerchantEntry = KnownMerchantMatch & { keywords: string[] };

/**
 * Statik, elle küratörlüğü yapılmış bilinen merchant tablosu (spec §12 adım 3).
 * `categoryName`/`subCategoryName` yalnızca kategori tahmini GÜVENLİ olduğunda
 * verilir (ör. Hostinger sadece hosting satar). Amazon/Trendyol/Hepsiburada
 * gibi her şeyi satan e-ticaret siteleri kasıtlı olarak kategorisiz bırakıldı
 * — yanlış pozitif üretmektense "Kategori seçilmedi" bırakmak tercih edildi.
 * Kategori adları `prisma/seed.ts`'deki gerçek seed kategorileriyle birebir
 * eşleşmeli; eşleşmezse `resolveCategoryByName` sessizce null döner.
 */
const KNOWN_MERCHANTS: KnownMerchantEntry[] = [
  { keywords: ["bim a.s", "bim market"], normalizedName: "BİM", categoryName: "Günlük Yaşam", subCategoryName: "Market" },
  { keywords: ["migros"], normalizedName: "Migros", categoryName: "Günlük Yaşam", subCategoryName: "Market" },
  { keywords: ["carrefour"], normalizedName: "CarrefourSA", categoryName: "Günlük Yaşam", subCategoryName: "Market" },
  { keywords: ["a101"], normalizedName: "A101", categoryName: "Günlük Yaşam", subCategoryName: "Market" },
  { keywords: ["şok market"], normalizedName: "ŞOK", categoryName: "Günlük Yaşam", subCategoryName: "Market" },
  { keywords: ["metro doğanay", "metro market", "metro tüketim"], normalizedName: "Metro", categoryName: "Günlük Yaşam", subCategoryName: "Market" },

  { keywords: ["uber"], normalizedName: "Uber", categoryName: "Günlük Yaşam", subCategoryName: "Ulaşım" },
  { keywords: ["bitaksi"], normalizedName: "BiTaksi", categoryName: "Günlük Yaşam", subCategoryName: "Ulaşım" },

  // Fatura/abonelik hizmetleri — 6 aylık gerçek veride neredeyse her ay tekrar eden markalar.
  { keywords: ["turkcell"], normalizedName: "Turkcell", categoryName: "Ev", subCategoryName: "Fatura" },
  { keywords: ["turksat"], normalizedName: "Türksat Kablo TV", categoryName: "Ev", subCategoryName: "Fatura" },
  { keywords: ["aski"], normalizedName: "ASKİ (Su)", categoryName: "Ev", subCategoryName: "Fatura" },
  { keywords: ["vodafone"], normalizedName: "Vodafone", categoryName: "Ev", subCategoryName: "Fatura" },

  // Hesap özeti (banka) verisinden — gerçek 6 aylık veride tekrar eden marka.
  { keywords: ["envato"], normalizedName: "Envato", categoryName: "Teknoloji", subCategoryName: "Yazılım" },

  { keywords: ["yemeksepeti"], normalizedName: "Yemeksepeti", categoryName: "Günlük Yaşam", subCategoryName: "Yemek" },
  { keywords: ["getir"], normalizedName: "Getir", categoryName: "Günlük Yaşam", subCategoryName: "Yemek" },

  { keywords: ["hostinger"], normalizedName: "Hostinger", categoryName: "Teknoloji", subCategoryName: "Hosting" },
  { keywords: ["godaddy"], normalizedName: "GoDaddy", categoryName: "Teknoloji", subCategoryName: "Hosting" },
  { keywords: ["vercel"], normalizedName: "Vercel", categoryName: "Teknoloji", subCategoryName: "Hosting" },

  { keywords: ["google one"], normalizedName: "Google One", categoryName: "Teknoloji", subCategoryName: "Dijital Hizmetler" },
  { keywords: ["youtubepremium", "youtube premium"], normalizedName: "YouTube Premium", categoryName: "Eğlence", subCategoryName: "Eğlence" },
  { keywords: ["youtube"], normalizedName: "YouTube", categoryName: "Eğlence", subCategoryName: "Eğlence" },
  { keywords: ["netflix"], normalizedName: "Netflix", categoryName: "Eğlence", subCategoryName: "Eğlence" },
  { keywords: ["spotify"], normalizedName: "Spotify", categoryName: "Eğlence", subCategoryName: "Eğlence" },

  { keywords: ["claude by anth", "anthropic"], normalizedName: "Claude (Anthropic)", categoryName: "Teknoloji", subCategoryName: "AI" },
  { keywords: ["openai", "chatgpt"], normalizedName: "OpenAI", categoryName: "Teknoloji", subCategoryName: "AI" },

  // Geniş kapsamlı e-ticaret — kasıtlı olarak kategorisiz (yukarıdaki not).
  { keywords: ["amazon", "amzn"], normalizedName: "Amazon" },
  { keywords: ["trendyol.com"], normalizedName: "Trendyol" },
  { keywords: ["hepsiburada"], normalizedName: "Hepsiburada" },
];

/**
 * `text` içinde (prefix'i zaten temizlenmiş merchant adında) bilinen bir
 * merchant arar. Daha SPESİFİK anahtar kelimeler listede daha ÖNCE
 * durmalıdır (ör. "youtubepremium" "youtube"den önce) — ilk eşleşen kazanır.
 */
export function findKnownMerchant(text: string): KnownMerchantMatch | null {
  const haystack = matchFold(text);
  for (const entry of KNOWN_MERCHANTS) {
    if (entry.keywords.some((keyword) => haystack.includes(matchFold(keyword)))) {
      return { normalizedName: entry.normalizedName, categoryName: entry.categoryName, subCategoryName: entry.subCategoryName };
    }
  }
  return null;
}
