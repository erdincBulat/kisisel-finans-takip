import { describe, expect, it } from "vitest";
import { computeFingerprint, getEffectiveMonth } from "@/lib/db/transaction.service";

describe("computeFingerprint", () => {
  const base = {
    date: new Date("2026-07-09T00:00:00.000Z"),
    normalizedMerchant: "Amazon",
    amount: 244900,
  };

  it("aynı girdi için her zaman aynı hash'i üretir", () => {
    expect(computeFingerprint(base)).toBe(computeFingerprint(base));
  });

  it("merchant büyük/küçük harf farkını yok sayar", () => {
    expect(computeFingerprint(base)).toBe(
      computeFingerprint({ ...base, normalizedMerchant: "AMAZON" }),
    );
  });

  it("farklı tutar farklı hash üretir", () => {
    expect(computeFingerprint(base)).not.toBe(computeFingerprint({ ...base, amount: 1 }));
  });

  it("taksit bilgisi hash'e dahil edilir (3/6 ile 4/6 farklı sayılmalı)", () => {
    const a = computeFingerprint({ ...base, installmentCurrent: 3, installmentTotal: 6 });
    const b = computeFingerprint({ ...base, installmentCurrent: 4, installmentTotal: 6 });
    expect(a).not.toBe(b);
  });
});

describe("getEffectiveMonth", () => {
  it("normal (taksitsiz) işlemde Transaction.date'i kullanır", () => {
    expect(
      getEffectiveMonth({
        date: new Date(Date.UTC(2026, 6, 15)),
        source: "STATEMENT",
        installmentTotal: null,
        statement: { year: 2026, month: 8 },
      }),
    ).toEqual({ year: 2026, month: 7 });
  });

  it("ekstre kaynaklı taksitli işlemde Statement'ın year/month'unu kullanır, Transaction.date'i DEĞİL (spec §53) — gerçek TRENDYOL verisiyle doğrulanan senaryo: satın alma 29/01/2026, 2. taksit Mart ekstresinde faturalandı", () => {
    expect(
      getEffectiveMonth({
        date: new Date(Date.UTC(2026, 0, 29)),
        source: "STATEMENT",
        installmentTotal: 3,
        statement: { year: 2026, month: 3 },
      }),
    ).toEqual({ year: 2026, month: 3 });
  });

  it("manuel girilen taksitli işlemde Transaction.date'i kullanır (Statement yok)", () => {
    expect(
      getEffectiveMonth({
        date: new Date(Date.UTC(2026, 5, 10)),
        source: "MANUAL",
        installmentTotal: 3,
        statement: null,
      }),
    ).toEqual({ year: 2026, month: 6 });
  });

  it("statement ilişkisi yüklenmemişse (null) Transaction.date'e düşer", () => {
    expect(
      getEffectiveMonth({
        date: new Date(Date.UTC(2026, 2, 1)),
        source: "STATEMENT",
        installmentTotal: 3,
        statement: null,
      }),
    ).toEqual({ year: 2026, month: 3 });
  });
});
