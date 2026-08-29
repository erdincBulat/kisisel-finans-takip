import { describe, expect, it } from "vitest";
import { buildInstallmentPlans, type InstallmentRow } from "@/lib/installments/schedule";

function row(overrides: Partial<InstallmentRow>): InstallmentRow {
  return {
    id: "tx-1",
    date: new Date(Date.UTC(2026, 0, 29)),
    description: "TRENDYOL.COM ISTANBUL TR (849,00 TL)",
    normalizedMerchant: "Trendyol",
    amount: 28300,
    source: "STATEMENT",
    installmentCurrent: 1,
    installmentTotal: 3,
    statement: null,
    ...overrides,
  };
}

describe("buildInstallmentPlans", () => {
  it("gerçek TRENDYOL senaryosu: 2/3 Mart ekstresinde, 3/3 Nisan ekstresinde — 1/3 hiç içe aktarılmamış", () => {
    const rows = [
      row({ id: "tx-2", installmentCurrent: 2, statement: { year: 2026, month: 3 } }),
      row({ id: "tx-3", installmentCurrent: 3, statement: { year: 2026, month: 4 } }),
    ];

    const [plan] = buildInstallmentPlans(rows);

    expect(plan.totalInstallments).toBe(3);
    expect(plan.latestKnownInstallment).toBe(3);
    expect(plan.status).toBe("COMPLETED");
    expect(plan.remainingInstallments).toBe(0);
    expect(plan.remainingAmount).toBe(0);
    expect(plan.totalAmount).toBe(28300 * 3);

    // 1/3 hiç ekstre olarak yüklenmemiş — Şubat 2026'ya enterpole edilmeli (Mart'tan 1 ay geri).
    expect(plan.occurrences).toEqual([
      { installmentCurrent: 1, year: 2026, month: 2, amount: 28300, status: "MISSING", transactionId: null },
      { installmentCurrent: 2, year: 2026, month: 3, amount: 28300, status: "REAL", transactionId: "tx-2" },
      { installmentCurrent: 3, year: 2026, month: 4, amount: 28300, status: "REAL", transactionId: "tx-3" },
    ]);
  });

  it("aktif bir plan için kalan taksitleri gelecek aylara projekte eder (spec §24)", () => {
    const rows = [row({ id: "tx-1", installmentCurrent: 1, installmentTotal: 6, statement: { year: 2026, month: 8 } })];

    const [plan] = buildInstallmentPlans(rows);

    expect(plan.status).toBe("ACTIVE");
    expect(plan.latestKnownInstallment).toBe(1);
    expect(plan.remainingInstallments).toBe(5);
    expect(plan.remainingAmount).toBe(28300 * 5);

    const projected = plan.occurrences.filter((o) => o.status === "PROJECTED");
    expect(projected.map((o) => ({ n: o.installmentCurrent, year: o.year, month: o.month }))).toEqual([
      { n: 2, year: 2026, month: 9 },
      { n: 3, year: 2026, month: 10 },
      { n: 4, year: 2026, month: 11 },
      { n: 5, year: 2026, month: 12 },
      { n: 6, year: 2027, month: 1 },
    ]);
  });

  it("manuel girilen taksitli işlemde Statement yerine Transaction.date'i kullanır", () => {
    const rows = [
      row({
        id: "tx-manual",
        source: "MANUAL",
        installmentCurrent: 1,
        installmentTotal: 2,
        date: new Date(Date.UTC(2026, 5, 10)),
        statement: null,
      }),
    ];

    const [plan] = buildInstallmentPlans(rows);
    expect(plan.occurrences[0]).toMatchObject({ installmentCurrent: 1, year: 2026, month: 6, status: "REAL" });
    expect(plan.occurrences[1]).toMatchObject({ installmentCurrent: 2, year: 2026, month: 7, status: "PROJECTED" });
  });

  it("aynı merchant için farklı satın alma tarihleri ayrı plan olarak kalır (birleştirilmez)", () => {
    const rows = [
      row({ id: "tx-a", date: new Date(Date.UTC(2026, 0, 29)), installmentCurrent: 1 }),
      row({ id: "tx-b", date: new Date(Date.UTC(2026, 3, 15)), installmentCurrent: 1 }),
    ];

    const plans = buildInstallmentPlans(rows);
    expect(plans).toHaveLength(2);
  });

  it("installmentCurrent/Total null olan satırları yok sayar", () => {
    const rows = [row({ installmentCurrent: null }), row({ installmentTotal: null })];
    expect(buildInstallmentPlans(rows)).toHaveLength(0);
  });
});
