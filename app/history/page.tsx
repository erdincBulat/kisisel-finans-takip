import { getMonthlyTrend, getLatestDataMonth } from "@/lib/analytics/monthly-summary";
import { YearNav } from "@/components/history/year-nav";
import { YearlySummaryList } from "@/components/history/yearly-summary-list";

export default async function HistoryPage(props: PageProps<"/history">) {
  const searchParams = await props.searchParams;
  const now = new Date();
  const latest = (await getLatestDataMonth()) ?? { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };

  const yearParam = typeof searchParams.year === "string" ? Number(searchParams.year) : NaN;
  const year = Number.isInteger(yearParam) ? yearParam : latest.year;

  const months = await getMonthlyTrend(year, 12, 12);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Geçmiş</h1>
          <p className="text-sm text-muted-foreground">Yıl bazlı aylık özet. Bir aya tıklayarak o ayın dashboard&apos;una gidebilirsiniz.</p>
        </div>
        <YearNav year={year} />
      </div>

      <YearlySummaryList months={months} />
    </div>
  );
}
