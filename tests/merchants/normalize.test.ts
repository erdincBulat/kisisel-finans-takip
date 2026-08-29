import { describe, expect, it } from "vitest";
import { normalizeMerchant, stripKnownPrefixes } from "@/lib/merchants/normalize";

describe("stripKnownPrefixes", () => {
  // Gerçek referans ekstredeki (05.08.2026) satırlardan alınmış örnekler.
  it("GOOGLE * önekini temizler", () => {
    expect(stripKnownPrefixes("GOOGLE *Google One")).toBe("Google One");
    expect(stripKnownPrefixes("GOOGLE *YouTubePremium")).toBe("YouTubePremium");
    expect(stripKnownPrefixes("GOOGLE *Claude by Anth")).toBe("Claude by Anth");
  });

  it("IYZICO/ önekini temizler", () => {
    expect(stripKnownPrefixes("IYZICO/hekimzadeb.mysho ISTANBUL TR")).toBe("hekimzadeb.mysho ISTANBUL TR");
  });

  it("PAYTR ÖD/ önekini temizler", () => {
    expect(stripKnownPrefixes("PAYTR ÖD/BIONSMART")).toBe("BIONSMART");
  });

  it("HEPSIPAY/ önekini temizler", () => {
    expect(stripKnownPrefixes("HEPSIPAY/HEPSIBURADA ISTANBUL TR")).toBe("HEPSIBURADA ISTANBUL TR");
  });

  // 05.03.2026 ekstresinden — PAYTR ÖD/'den farklı, boşluksuz gerçek bir varyant.
  it("PAYTR/ önekini (PAYTR ÖD/'den farklı, boşluksuz varyant) temizler", () => {
    expect(stripKnownPrefixes("PAYTR/ZUHREANADAN")).toBe("ZUHREANADAN");
  });

  // 05.06.2026 ekstresinden.
  it("N KOLAY ODEM/ önekini temizler", () => {
    expect(stripKnownPrefixes("N KOLAY ODEM/ISMAIL OZGUL")).toBe("ISMAIL OZGUL");
  });

  it("bilinen önek yoksa metni değiştirmeden (trim'lenmiş) döner", () => {
    expect(stripKnownPrefixes("  MERVE MARKET  ")).toBe("MERVE MARKET");
    expect(stripKnownPrefixes("BIM A.S. / L335/ KUTSAL")).toBe("BIM A.S. / L335/ KUTSAL");
  });

  it("önek eşleşmesi case-insensitive çalışır", () => {
    expect(stripKnownPrefixes("google *Some Service")).toBe("Some Service");
  });
});

describe("normalizeMerchant", () => {
  it("önek temizler ve bilinen merchant adını kanonikleştirir", () => {
    expect(normalizeMerchant("GOOGLE *YouTube")).toBe("YouTube");
    expect(normalizeMerchant("GOOGLE *YouTubePremium")).toBe("YouTube Premium");
    expect(normalizeMerchant("GOOGLE *Claude by Anth")).toBe("Claude (Anthropic)");
  });

  it("bilinmeyen merchant için önek-temizlenmiş metni döner", () => {
    expect(normalizeMerchant("PAYTR ÖD/BIONSMART")).toBe("BIONSMART");
  });

  it("fazla boşlukları sadeleştirir", () => {
    expect(normalizeMerchant("MERVE   MARKET")).toBe("MERVE MARKET");
  });

  it("Türkçe İ karakteri içeren gerçek metinleri bozmadan işler (locale-aware lowercasing gerektiren durum)", () => {
    expect(normalizeMerchant("KARS PETROL TİCARET LİMİT")).toBe("KARS PETROL TİCARET LİMİT");
  });
});
