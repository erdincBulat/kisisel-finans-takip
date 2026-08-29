import { describe, expect, it } from "vitest";
import {
  classifyTransactionType,
  extractInstallmentToken,
  isBankFeeLine,
  parseTransactionLine,
} from "@/lib/pdf/normalize-transaction";

describe("parseTransactionLine — gerçek ekstre satırları", () => {
  it("basit bir market işlemini ayrıştırır", () => {
    const tx = parseTransactionLine("05/07/2026 MERVE MARKET 140,00 TL");
    expect(tx).toMatchObject({
      description: "MERVE MARKET",
      amount: 14000,
      type: "EXPENSE",
      isBankFee: false,
    });
    expect(tx?.date.toISOString().slice(0, 10)).toBe("2026-07-05");
  });

  it("ödeme satırını PAYMENT olarak sınıflandırır ve '- ' işaretini tutara karıştırmaz", () => {
    const tx = parseTransactionLine("09/07/2026 Ödeme - Enpara.com Cep Şubesi - 15.000,00 TL");
    expect(tx).toMatchObject({
      description: "Ödeme - Enpara.com Cep Şubesi",
      amount: 1500000,
      type: "PAYMENT",
    });
  });

  it("açıklama içindeki tireyi (iç kısa çizgi) tutar işaretiyle karıştırmaz", () => {
    const tx = parseTransactionLine("15/07/2026 Motorlu Taşıtlar Vergisi - Tahsilatı 590,50 TL");
    expect(tx?.description).toBe("Motorlu Taşıtlar Vergisi - Tahsilatı");
    expect(tx?.type).toBe("EXPENSE");
  });

  it("ödeme kuruluşu önekli satırları (IYZICO/, PAYTR ÖD/, HEPSIPAY/) olduğu gibi korur", () => {
    expect(parseTransactionLine("09/07/2026 IYZICO/hekimzadee.mysho ISTANBUL TR 4.444,00 TL")?.description).toBe(
      "IYZICO/hekimzadee.mysho ISTANBUL TR",
    );
    expect(parseTransactionLine("09/07/2026 PAYTR ÖD/BIONSMART 1.148,00 TL")?.description).toBe(
      "PAYTR ÖD/BIONSMART",
    );
  });

  it("faiz/KKDF/BSMV satırlarını banka ücreti olarak işaretler", () => {
    const tx = parseTransactionLine("05/08/2026 Alışveriş faizi 278,89 TL");
    expect(tx?.isBankFee).toBe(true);
    expect(tx?.type).toBe("EXPENSE");
  });

  it("'/' içeren ama taksit olmayan merchant adlarını (BIM A.S. / L335/ KUTSAL) yanlış ayrıştırmaz", () => {
    const tx = parseTransactionLine("15/07/2026 BIM A.S. / L335/ KUTSAL 504,00 TL");
    expect(tx?.description).toBe("BIM A.S. / L335/ KUTSAL");
    expect(tx?.installmentCurrent).toBeNull();
    expect(tx?.installmentTotal).toBeNull();
  });

  it("işlem satırı olmayan satırlar için null döner", () => {
    expect(parseTransactionLine("Bir önceki ekstre bakiyeniz 23.304,17 TL")).toBeNull();
    expect(parseTransactionLine("Sayfa 1 / 2")).toBeNull();
    expect(parseTransactionLine("İşlem tarihi Açıklama Taksit Tutar")).toBeNull();
    expect(parseTransactionLine("")).toBeNull();
  });
});

describe("parseTransactionLine — GERÇEK taksitli satır (05.03.2026 ekstresi, bkz. fixtures/README.md)", () => {
  it("taksit tutarını (toplam fiyat değil) ve N/M'yi doğru ayırır; parantez içindeki toplam fiyatı açıklamada korur", () => {
    const tx = parseTransactionLine("29/01/2026 TRENDYOL.COM ISTANBUL TR (849,00 TL) 2/3 283,00 TL");
    expect(tx).toMatchObject({
      description: "TRENDYOL.COM ISTANBUL TR (849,00 TL)",
      amount: 28300, // taksit başına tutar (849,00 / 3), toplam fiyat değil
      installmentCurrent: 2,
      installmentTotal: 3,
      type: "EXPENSE",
    });
  });
});

// Not: gerçek formatta ("...(849,00 TL) 2/3 283,00 TL", yukarıdaki test) taksit
// öbeği tutardan hemen önce geliyor — aşağıdaki "Apple Store 3/6" varsayımı
// birebir tutmadı, ama extractInstallmentToken'ın "açıklamanın SONUNDA N/M"
// mekanizması yapısal olduğu için gerçek veride de doğru çalıştı (yukarıya bkz.).
describe("extractInstallmentToken — VARSAYIMSAL format (bkz. fixtures/README.md)", () => {
  it("sondaki N/M öbeğini taksit olarak ayırır", () => {
    expect(extractInstallmentToken("Apple Store 3/6")).toEqual({
      description: "Apple Store",
      installmentCurrent: 3,
      installmentTotal: 6,
    });
  });

  it("taksit yoksa açıklamayı değiştirmeden döner", () => {
    expect(extractInstallmentToken("MERVE MARKET")).toEqual({
      description: "MERVE MARKET",
      installmentCurrent: null,
      installmentTotal: null,
    });
  });

  it("mevcut > toplam gibi anlamsız değerleri taksit saymaz", () => {
    expect(extractInstallmentToken("Garip Işlem 9/3").installmentCurrent).toBeNull();
  });
});

describe("classifyTransactionType", () => {
  it("'Ödeme' ile başlayan açıklamaları PAYMENT sayar", () => {
    expect(classifyTransactionType("Ödeme - Enpara.com Cep Şubesi", true)).toBe("PAYMENT");
  });

  it("negatif işaretli ama ödeme olmayan satırları REFUND sayar (varsayım, gerçek örnek yok)", () => {
    expect(classifyTransactionType("Trendyol İade", true)).toBe("REFUND");
  });

  it("pozitif tutarlı normal satırları EXPENSE sayar", () => {
    expect(classifyTransactionType("MERVE MARKET", false)).toBe("EXPENSE");
  });
});

describe("isBankFeeLine", () => {
  it("KKDF ve BSMV varyasyonlarını tanır", () => {
    expect(isBankFeeLine("Faizlerin KKDF’si*")).toBe(true);
    expect(isBankFeeLine("Faiz ve ücretlerin BSMV'si*")).toBe(true);
  });

  it("normal bir merchant adını ücret sanmaz", () => {
    expect(isBankFeeLine("GOOGLE *Claude by Anth")).toBe(false);
  });
});
