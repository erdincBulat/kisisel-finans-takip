import { describe, expect, it } from "vitest";
import { computeBudgetProgress } from "@/lib/db/budget.service";

const YEMEK = "cat-yemek";
const YEMEK_RESTORAN = "sub-restoran";
const MARKET = "cat-market";

function budget(overrides: Partial<Parameters<typeof computeBudgetProgress>[0][number]>) {
  return {
    id: "b-1",
    categoryId: YEMEK,
    category: { name: "Yemek", color: "#f97316" },
    subCategoryId: null,
    subCategory: null,
    limitAmount: 500000, // 5.000 TL
    ...overrides,
  };
}

describe("computeBudgetProgress", () => {
  it("ana kategori bütçesi, alt kategorili işlemler dahil tüm harcamayı kapsar", () => {
    const budgets = [budget({})];
    const transactions = [
      { amount: 200000, type: "EXPENSE" as const, categoryId: YEMEK, subCategoryId: YEMEK_RESTORAN },
      { amount: 100000, type: "EXPENSE" as const, categoryId: YEMEK, subCategoryId: null },
      { amount: 999999, type: "EXPENSE" as const, categoryId: MARKET, subCategoryId: null },
    ];

    const [result] = computeBudgetProgress(budgets, transactions);

    expect(result.spent).toBe(300000);
    expect(result.remaining).toBe(200000);
    expect(result.percent).toBe(60);
    expect(result.exceeded).toBe(false);
  });

  it("alt kategori bütçesi yalnızca o alt kategorinin harcamasını sayar", () => {
    const budgets = [budget({ id: "b-2", subCategoryId: YEMEK_RESTORAN, subCategory: { name: "Restoran" } })];
    const transactions = [
      { amount: 200000, type: "EXPENSE" as const, categoryId: YEMEK, subCategoryId: YEMEK_RESTORAN },
      { amount: 100000, type: "EXPENSE" as const, categoryId: YEMEK, subCategoryId: null },
    ];

    const [result] = computeBudgetProgress(budgets, transactions);

    expect(result.spent).toBe(200000);
  });

  it("REFUND harcamayı düşürür, limiti aşınca exceeded true olur", () => {
    const budgets = [budget({ limitAmount: 100000 })];
    const transactions = [
      { amount: 150000, type: "EXPENSE" as const, categoryId: YEMEK, subCategoryId: null },
      { amount: 20000, type: "REFUND" as const, categoryId: YEMEK, subCategoryId: null },
    ];

    const [result] = computeBudgetProgress(budgets, transactions);

    expect(result.spent).toBe(130000);
    expect(result.remaining).toBe(-30000);
    expect(result.exceeded).toBe(true);
    expect(result.percent).toBe(130);
  });

  it("net iade (negatif harcama) 0'a kırpılır, aşım olmaz", () => {
    const budgets = [budget({})];
    const transactions = [{ amount: 50000, type: "REFUND" as const, categoryId: YEMEK, subCategoryId: null }];

    const [result] = computeBudgetProgress(budgets, transactions);

    expect(result.spent).toBe(0);
    expect(result.exceeded).toBe(false);
  });

  it("bu kategoride hiç işlem yoksa spent 0, percent 0", () => {
    const [result] = computeBudgetProgress([budget({})], []);

    expect(result.spent).toBe(0);
    expect(result.percent).toBe(0);
    expect(result.exceeded).toBe(false);
  });
});
