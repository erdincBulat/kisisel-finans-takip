import { matchFold } from "@/lib/merchants/text";

export type PatternMatch = {
  categoryName: string;
  subCategoryName?: string;
};

type PatternRule = {
  keywords: string[];
  categoryName: string;
  subCategoryName?: string;
};

/**
 * Geniş anahtar kelime tabanlı kurallar (spec §12 adım 4) — belirli bir
 * merchant adı değil, işlem SINIFI için. `lib/merchants/known-merchants.ts`
 * daha spesifik olduğu için engine bu katmandan önce kontrol eder; burada
 * yakalanmayan (ör. "MERVE MARKET" gibi ulusal marka olmayan yerel işletmeler)
 * işlemler bu genel kalıplarla eşleşir. Kategori adları `prisma/seed.ts`'deki
 * gerçek seed kategorileriyle birebir eşleşmeli.
 */
const PATTERN_RULES: PatternRule[] = [
  { keywords: ["market", "manav", "şarküteri", "bakkal"], categoryName: "Günlük Yaşam", subCategoryName: "Market" },
  { keywords: ["yemek", "büfe", "restoran", "restaurant", "lokanta", "kafe", "cafe"], categoryName: "Günlük Yaşam", subCategoryName: "Yemek" },
  { keywords: ["petrol", "akaryakıt", "taksi", "otobüs", "otopark", "ulaşım"], categoryName: "Günlük Yaşam", subCategoryName: "Ulaşım" },
  { keywords: ["elektrik", "elektri", "telekom", "internet/tv", "doğalgaz", "su faturası"], categoryName: "Ev", subCategoryName: "Fatura" },
  { keywords: ["vergi"], categoryName: "Finans", subCategoryName: "Vergi" },
  { keywords: ["hosting", "domain", "sunucu"], categoryName: "Teknoloji", subCategoryName: "Hosting" },
];

/**
 * `isBankFee` true ise (Faz 4'ün parser'ı faiz/KKDF/BSMV satırlarını zaten
 * işaretliyor) doğrudan Finans/Bankacılık'a atar — bu tür satırlar merchant
 * değil banka kaynaklı olduğu için diğer kelime kalıplarından önce kontrol edilir.
 */
export function matchPatternRule(description: string, isBankFee: boolean): PatternMatch | null {
  if (isBankFee) return { categoryName: "Finans", subCategoryName: "Bankacılık" };

  const haystack = matchFold(description);
  for (const rule of PATTERN_RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(matchFold(keyword)))) {
      return { categoryName: rule.categoryName, subCategoryName: rule.subCategoryName };
    }
  }
  return null;
}
