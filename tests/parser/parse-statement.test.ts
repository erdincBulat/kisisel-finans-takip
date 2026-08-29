import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseEnparaStatementText } from "@/lib/pdf/parse-statement";

const FIXTURES_DIR = join(import.meta.dirname, "fixtures");
const realText = readFileSync(join(FIXTURES_DIR, "enpara-2026-08-real.txt"), "utf-8");
const installmentText = readFileSync(join(FIXTURES_DIR, "enpara-hypothetical-installment.txt"), "utf-8");
const realInstallmentText = readFileSync(join(FIXTURES_DIR, "enpara-2026-03-installment-real.txt"), "utf-8");

describe("parseEnparaStatementText — gerçek 05.08.2026 ekstresi", () => {
  const parsed = parseEnparaStatementText(realText);

  it("ekstre tarihini ve bir sonraki ekstre tarihini doğru okur", () => {
    expect(parsed.statementDate.toISOString().slice(0, 10)).toBe("2026-08-05");
    expect(parsed.nextStatementDate?.toISOString().slice(0, 10)).toBe("2026-09-05");
  });

  it("year/month'u ekstre tarihinden türetir (Statement kimliği — spec §8)", () => {
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(8);
  });

  it("periodStart'ı en erken işlem tarihinden türetir (ekstre üzerinde açıkça yazmıyor)", () => {
    expect(parsed.periodStart.toISOString().slice(0, 10)).toBe("2026-07-05");
    expect(parsed.periodEnd.toISOString().slice(0, 10)).toBe("2026-08-05");
  });

  it("tüm 37 işlemi çıkarır, özet/başlık/footer satırlarını dahil etmez", () => {
    expect(parsed.transactions).toHaveLength(37);
    expect(parsed.transactions.some((t) => t.description.includes("Bir önceki ekstre bakiyeniz"))).toBe(false);
  });

  it("aynı ekstrede iki sayfaya bölünmüş işlemlerin hepsini toplar (sayfa geçişi kaybı yok)", () => {
    const lastPage2Tx = parsed.transactions.find((t) => t.description === "Faiz ve ücretlerin BSMV'si*");
    expect(lastPage2Tx).toBeDefined();
  });

  it("mutabakat toplamlarını header'dan doğru okur", () => {
    expect(parsed.reconciliation).toEqual({
      previousBalance: 2330417,
      payments: 1500000,
      purchasesAndInstallments: 1645009,
      cashAdvance: 0,
      feesAndInterest: 36255,
      total: 2511681,
    });
  });

  it("ödeme satırını PAYMENT, faiz satırlarını isBankFee=true olarak işaretler", () => {
    const payment = parsed.transactions.find((t) => t.type === "PAYMENT");
    expect(payment?.amount).toBe(1500000);

    const feeLines = parsed.transactions.filter((t) => t.isBankFee);
    expect(feeLines).toHaveLength(3);
    expect(feeLines.reduce((sum, t) => sum + t.amount, 0)).toBe(36255);
  });

  it("bu ekstrede hiçbir işlemde taksit bilgisi yok (gerçek veri, varsayım değil)", () => {
    expect(parsed.transactions.every((t) => t.installmentCurrent === null)).toBe(true);
  });
});

describe("parseEnparaStatementText — VARSAYIMSAL taksit fixture'ı", () => {
  it("taksitli işlemi doğru ayrıştırır", () => {
    const parsed = parseEnparaStatementText(installmentText);
    const installmentTx = parsed.transactions.find((t) => t.description === "Apple Store");
    expect(installmentTx).toMatchObject({ installmentCurrent: 3, installmentTotal: 6, amount: 100000 });
  });
});

describe("parseEnparaStatementText — GERÇEK 05.03.2026 ekstresi (ilk gerçek taksitli veri)", () => {
  const parsed = parseEnparaStatementText(realInstallmentText);

  it("year/month'u doğru türetir", () => {
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(3);
  });

  it("22 işlemin tamamını çıkarır (2 sayfaya bölünmüş)", () => {
    expect(parsed.transactions).toHaveLength(22);
  });

  it("gerçek taksitli satırı (Trendyol, toplam fiyat parantez içinde) doğru ayrıştırır", () => {
    const installmentTx = parsed.transactions.find((t) => t.installmentCurrent !== null);
    expect(installmentTx).toMatchObject({
      description: "TRENDYOL.COM ISTANBUL TR (849,00 TL)",
      amount: 28300,
      installmentCurrent: 2,
      installmentTotal: 3,
    });
  });

  it("mutabakat toplamları (harcama/taksit dahil) kuruşuna kadar tutar", () => {
    expect(parsed.reconciliation).toEqual({
      previousBalance: 1767958,
      payments: 720000,
      purchasesAndInstallments: 908654,
      cashAdvance: 0,
      feesAndInterest: 41325,
      total: 1997937,
    });
  });
});

describe("parseEnparaStatementText — hata durumları", () => {
  it("ekstre tarihi bulunamazsa anlamlı bir hata fırlatır", () => {
    expect(() => parseEnparaStatementText("bu bir PDF metni değil")).toThrow(/Ekstre tarihi bulunamadı/);
  });
});
