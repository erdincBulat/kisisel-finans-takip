import { describe, expect, it } from "vitest";
import { formatMonthYear } from "@/lib/format-date";

describe("formatMonthYear", () => {
  it("yıl ve ay numarasından Türkçe ay adını üretir", () => {
    expect(formatMonthYear(2026, 8)).toBe("Ağustos 2026");
  });

  it("yılın ilk ayını doğru çevirir (ay index kaymasına düşmez)", () => {
    expect(formatMonthYear(2026, 1)).toBe("Ocak 2026");
  });

  it("yılın son ayını doğru çevirir", () => {
    expect(formatMonthYear(2026, 12)).toBe("Aralık 2026");
  });
});
