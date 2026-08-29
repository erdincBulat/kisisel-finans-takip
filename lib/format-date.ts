const MONTH_YEAR_FORMATTER = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric" });

/** "2026, 8" → "Ağustos 2026" (ekstre dönemi başlıkları ve duplicate mesajları için, spec §8/§47). */
export function formatMonthYear(year: number, month: number): string {
  return MONTH_YEAR_FORMATTER.format(new Date(Date.UTC(year, month - 1, 1)));
}
