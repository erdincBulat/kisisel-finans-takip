import { describe, expect, it } from "vitest";
import { matchPatternRule } from "@/lib/categorization/pattern-rules";

describe("matchPatternRule", () => {
  it("banka ücreti bayrağı varsa doğrudan Finans/Bankacılık döner (diğer kelimelerden önce)", () => {
    expect(matchPatternRule("Alışveriş faizi", true)).toEqual({ categoryName: "Finans", subCategoryName: "Bankacılık" });
    expect(matchPatternRule("Faizlerin KKDF'si*", true)).toEqual({ categoryName: "Finans", subCategoryName: "Bankacılık" });
  });

  it("ulusal marka olmayan yerel marketleri genel 'market' kelimesiyle yakalar", () => {
    expect(matchPatternRule("MERVE MARKET", false)).toEqual({ categoryName: "Günlük Yaşam", subCategoryName: "Market" });
    expect(matchPatternRule("KARTAL MARKET", false)).toEqual({ categoryName: "Günlük Yaşam", subCategoryName: "Market" });
  });

  it("vergi ödemelerini yakalar", () => {
    expect(matchPatternRule("Motorlu Taşıtlar Vergisi - Tahsilatı", false)).toEqual({
      categoryName: "Finans",
      subCategoryName: "Vergi",
    });
  });

  it("elektrik/telekom faturalarını yakalar (kısaltılmış 'ELEKTRI' dahil)", () => {
    expect(matchPatternRule("000012345678 - ENERJISA BASKENT ELEKTRI", false)).toEqual({
      categoryName: "Ev",
      subCategoryName: "Fatura",
    });
    expect(matchPatternRule("7001234567 - TURK TELEKOM INTERNET/TV (", false)).toEqual({
      categoryName: "Ev",
      subCategoryName: "Fatura",
    });
  });

  it("yemek/büfe işlemlerini yakalar", () => {
    expect(matchPatternRule("Trendyol - Yemek ISTANBUL TR", false)).toEqual({
      categoryName: "Günlük Yaşam",
      subCategoryName: "Yemek",
    });
    expect(matchPatternRule("KARADENİZ BÜFE", false)).toEqual({ categoryName: "Günlük Yaşam", subCategoryName: "Yemek" });
  });

  it("petrol istasyonlarını ulaşım olarak yakalar", () => {
    expect(matchPatternRule("KARS PETROL TİCARET LİMİT", false)).toEqual({
      categoryName: "Günlük Yaşam",
      subCategoryName: "Ulaşım",
    });
  });

  it("kişi adı gibi görünen (AYŞE DEMİR) veya belirsiz metinler için null döner — yanlış pozitif üretmez", () => {
    expect(matchPatternRule("AYŞE DEMİR", false)).toBeNull();
    expect(matchPatternRule("BIONSMART", false)).toBeNull();
  });
});
