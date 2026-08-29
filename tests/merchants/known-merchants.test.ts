import { describe, expect, it } from "vitest";
import { findKnownMerchant } from "@/lib/merchants/known-merchants";

describe("findKnownMerchant", () => {
  it("kategorisi güvenli olan bilinen bir merchant için kategori önerir", () => {
    expect(findKnownMerchant("Google One")).toEqual({
      normalizedName: "Google One",
      categoryName: "Teknoloji",
      subCategoryName: "Dijital Hizmetler",
    });
    expect(findKnownMerchant("Claude by Anth")).toEqual({
      normalizedName: "Claude (Anthropic)",
      categoryName: "Teknoloji",
      subCategoryName: "AI",
    });
  });

  it("daha spesifik anahtar kelime genel olandan önce eşleşir (YouTubePremium vs YouTube)", () => {
    expect(findKnownMerchant("YouTubePremium")?.normalizedName).toBe("YouTube Premium");
    expect(findKnownMerchant("YouTube")?.normalizedName).toBe("YouTube");
  });

  it("geniş kapsamlı e-ticaret merchant'ları için isim verir ama kategori ÖNERMEZ (yanlış pozitif riski)", () => {
    expect(findKnownMerchant("TRENDYOL.COM ISTANBUL TR")).toEqual({
      normalizedName: "Trendyol",
      categoryName: undefined,
      subCategoryName: undefined,
    });
    expect(findKnownMerchant("HEPSIBURADA ISTANBUL TR")?.categoryName).toBeUndefined();
  });

  it("aynı marka farklı iş kolunda ise (Trendyol e-ticaret vs Trendyol Yemek) sadece tam eşleşen keyword'ü yakalar", () => {
    // ".com" olmayan "Trendyol - Yemek" satırı bu tabloda YAKALANMAMALI —
    // kategorisi pattern-rules.ts'teki "yemek" kelimesinden gelmeli.
    expect(findKnownMerchant("Trendyol - Yemek ISTANBUL TR")).toBeNull();
  });

  it("6 aylık gerçek veride neredeyse her ay tekrar eden fatura markalarını tanır (Türkçe I/ı katlaması gerektirir)", () => {
    expect(findKnownMerchant("000012345678 - ENERJISA BASKENT ELEKTRI")).toBeNull(); // known-merchant değil, pattern-rules'ta
    expect(findKnownMerchant("5001234567 - TURKCELL - ODEME")).toEqual({
      normalizedName: "Turkcell",
      categoryName: "Ev",
      subCategoryName: "Fatura",
    });
    expect(findKnownMerchant("1001234567 - TURKSAT KABLO TV - ODEME")).toEqual({
      normalizedName: "Türksat Kablo TV",
      categoryName: "Ev",
      subCategoryName: "Fatura",
    });
    // "ASKI" -> Türkçe locale'de "ı" (noktasız) olur, matchFold ile "aski"ye katlanmalı.
    expect(findKnownMerchant("00001234 - ANKARA SU (ASKI) - ODEME")).toEqual({
      normalizedName: "ASKİ (Su)",
      categoryName: "Ev",
      subCategoryName: "Fatura",
    });
  });

  it("bilinmeyen bir merchant için null döner", () => {
    expect(findKnownMerchant("BIONSMART")).toBeNull();
    expect(findKnownMerchant("AYŞE DEMİR")).toBeNull();
  });

  it("case-insensitive eşleşir (Türkçe locale ile)", () => {
    expect(findKnownMerchant("hostinger.w")?.normalizedName).toBe("Hostinger");
  });
});
