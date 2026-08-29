import { describe, expect, it } from "vitest";
import { statementImportSchema } from "@/lib/validation/statement-import.schema";

function baseInput() {
  return {
    year: 2026,
    month: 8,
    statementDate: new Date("2026-08-05T00:00:00.000Z"),
    periodStart: new Date("2026-07-05T00:00:00.000Z"),
    periodEnd: new Date("2026-08-05T00:00:00.000Z"),
    fileName: "05.08.2026 ekstresi.pdf",
    previousBalance: 1500000,
    transactions: [
      {
        date: new Date("2026-08-01T00:00:00.000Z"),
        description: "Amazon",
        amount: 249990,
        type: "EXPENSE" as const,
        categoryId: null,
        subCategoryId: null,
        installmentCurrent: null,
        installmentTotal: null,
      },
    ],
  };
}

describe("statementImportSchema", () => {
  it("geçerli bir önizleme payload'unu kabul eder", () => {
    const result = statementImportSchema.safeParse(baseInput());
    expect(result.success).toBe(true);
  });

  it("kategori seçilmemiş (null) işlemi kabul eder — kaydetme sırasında kategori zorunlu değildir (spec §19)", () => {
    const input = baseInput();
    const result = statementImportSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("boş transaction listesini reddeder", () => {
    const input = { ...baseInput(), transactions: [] };
    const result = statementImportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("geçersiz tür değerini reddeder", () => {
    const input = baseInput();
    input.transactions[0] = { ...input.transactions[0], type: "INCOME" as never };
    const result = statementImportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("negatif tutarı reddeder", () => {
    const input = baseInput();
    input.transactions[0] = { ...input.transactions[0], amount: -100 };
    const result = statementImportSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
