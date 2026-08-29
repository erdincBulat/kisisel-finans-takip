import { describe, expect, it } from "vitest";
import { buildInstallmentPlans, type InstallmentRow } from "@/lib/installments/schedule";
import {
  buildInstallmentBurdenByMonth,
  getActivePlans,
  getCompletedPlans,
  getTotalRemainingDebt,
} from "@/lib/installments/calculations";

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

describe("buildInstallmentBurdenByMonth", () => {
  it("her aktif planın gelecek taksitini doğru aya toplar, MISSING satırları hariç tutar", () => {
    const plans = buildInstallmentPlans([
      row({ id: "a", installmentCurrent: 1, installmentTotal: 6, statement: { year: 2026, month: 8 } }),
    ]);

    const burden = buildInstallmentBurdenByMonth(plans, 2026, 9, 4);

    expect(burden).toEqual([
      { year: 2026, month: 9, total: 28300, count: 1 },
      { year: 2026, month: 10, total: 28300, count: 1 },
      { year: 2026, month: 11, total: 28300, count: 1 },
      { year: 2026, month: 12, total: 28300, count: 1 },
    ]);
  });

  it("tamamlanmış planları geleceğe hiç yük olarak yansıtmaz", () => {
    const plans = buildInstallmentPlans([
      row({ id: "a", installmentCurrent: 3, installmentTotal: 3, statement: { year: 2026, month: 4 } }),
    ]);

    const burden = buildInstallmentBurdenByMonth(plans, 2026, 9, 3);
    expect(burden.every((b) => b.total === 0)).toBe(true);
  });

  it("birden fazla aktif plan aynı aya düşerse toplanır", () => {
    const plans = buildInstallmentPlans([
      row({ id: "a", normalizedMerchant: "A", installmentCurrent: 1, installmentTotal: 3, amount: 10000, statement: { year: 2026, month: 8 } }),
      row({ id: "b", normalizedMerchant: "B", date: new Date(Date.UTC(2026, 1, 1)), installmentCurrent: 1, installmentTotal: 3, amount: 5000, statement: { year: 2026, month: 8 } }),
    ]);

    const burden = buildInstallmentBurdenByMonth(plans, 2026, 9, 1);
    expect(burden[0]).toEqual({ year: 2026, month: 9, total: 15000, count: 2 });
  });
});

describe("getActivePlans / getCompletedPlans / getTotalRemainingDebt", () => {
  const plans = buildInstallmentPlans([
    row({ id: "a", normalizedMerchant: "A", installmentCurrent: 1, installmentTotal: 3, amount: 10000, statement: { year: 2026, month: 8 } }),
    row({ id: "b", normalizedMerchant: "B", date: new Date(Date.UTC(2026, 1, 1)), installmentCurrent: 3, installmentTotal: 3, amount: 5000, statement: { year: 2026, month: 4 } }),
  ]);

  it("aktif ve tamamlanmış planları doğru ayırır", () => {
    expect(getActivePlans(plans)).toHaveLength(1);
    expect(getCompletedPlans(plans)).toHaveLength(1);
    expect(getActivePlans(plans)[0].merchant).toBe("A");
  });

  it("toplam kalan borcu yalnızca verilen planlar üzerinden hesaplar", () => {
    expect(getTotalRemainingDebt(getActivePlans(plans))).toBe(10000 * 2);
    expect(getTotalRemainingDebt(getCompletedPlans(plans))).toBe(0);
  });
});
