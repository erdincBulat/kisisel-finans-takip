import { describe, expect, it } from "vitest";
import { parseTLToKurus, kurusToTL, formatKurus, kurusToTLInput } from "@/lib/money";

describe("parseTLToKurus", () => {
  it("binlik ayraçlı ve virgüllü Türkçe tutarı doğru kuruşa çevirir", () => {
    expect(parseTLToKurus("1.250,50")).toBe(125050);
  });

  it("binlik ayraç olmadan da doğru çalışır", () => {
    expect(parseTLToKurus("140,00")).toBe(14000);
  });

  it("gerçek ekstredeki büyük tutarı doğru çevirir", () => {
    // 05.08.2026 tarihli Enpara ekstresi — Ekstre borcu
    expect(parseTLToKurus("25.116,81")).toBe(2511681);
  });

  it("0.1 + 0.2 tarzı floating point hatasına düşmez", () => {
    const a = parseTLToKurus("0,10");
    const b = parseTLToKurus("0,20");
    expect(a + b).toBe(30);
  });
});

describe("kurusToTL / formatKurus", () => {
  it("kuruşu TL'ye çevirir", () => {
    expect(kurusToTL(125050)).toBeCloseTo(1250.5);
  });

  it("tr-TR para birimi formatında gösterir", () => {
    expect(formatKurus(125050)).toContain("1.250,50");
  });
});

describe("kurusToTLInput", () => {
  it("form input alanı için ₺ sembolü/binlik ayraç olmadan virgüllü tutar üretir", () => {
    expect(kurusToTLInput(125050)).toBe("1250,50");
  });

  it("parseTLToKurus ile geri okunabilir (round-trip)", () => {
    expect(parseTLToKurus(kurusToTLInput(2511681))).toBe(2511681);
  });
});
