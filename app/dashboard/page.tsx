import { listStatements, getCurrentCardBalance } from "@/lib/db/statement.service";
import { listTransactions } from "@/lib/db/transaction.service";
import { listCategoryTree } from "@/lib/db/category.service";
import { getMonthlySummary, getMonthlyTrend, getLatestDataMonth } from "@/lib/analytics/monthly-summary";
import { getCategoryBreakdown, getSubCategoryBreakdowns } from "@/lib/analytics/category-breakdown";
import { getMonthComparison } from "@/lib/analytics/comparisons";
import { getUpcomingInstallmentsSummary, getSubscriptionsSummary } from "@/lib/analytics/upcoming";
import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { MonthNav } from "@/components/dashboard/month-nav";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { MonthlyTrendChart } from "@/components/dashboard/monthly-trend-chart";
import { CategoryDonut } from "@/components/dashboard/category-donut";
import { CurrentDebtCard } from "@/components/dashboard/current-debt-card";
import { UpcomingInstallmentsCard } from "@/components/dashboard/upcoming-installments-card";
import { SubscriptionsSummaryCard } from "@/components/dashboard/subscriptions-summary-card";

function parseMonthParam(raw: string | undefined): { year: number; month: number } | null {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const searchParams = await props.searchParams;
  const statements = await listStatements();

  // İlk kullanım deneyimi (spec §69): hiç ekstre yoksa boş dashboard yerine karşılama ekranı.
  if (statements.length === 0) {
    return <DashboardEmptyState />;
  }

  const monthParam = typeof searchParams.month === "string" ? searchParams.month : undefined;
  const now = new Date();
  const fallback = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const latest = (await getLatestDataMonth()) ?? fallback;
  const selected = parseMonthParam(monthParam) ?? latest;

  const [summary, comparison, breakdown, subBreakdowns, categoryTree, trend, upcomingInstallments, subscriptions, monthTransactions, currentDebt] =
    await Promise.all([
      getMonthlySummary(selected.year, selected.month),
      getMonthComparison(selected.year, selected.month),
      getCategoryBreakdown(selected.year, selected.month),
      getSubCategoryBreakdowns(selected.year, selected.month),
      listCategoryTree(),
      getMonthlyTrend(selected.year, selected.month, 12),
      getUpcomingInstallmentsSummary(selected.year, selected.month),
      getSubscriptionsSummary(selected.year, selected.month),
      listTransactions({ year: selected.year, month: selected.month }),
      getCurrentCardBalance(),
    ]);

  const expenseCategoryTree = categoryTree.filter((c) => !c.isIncome);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Genel finansal durum özeti.</p>
        </div>
        <MonthNav year={selected.year} month={selected.month} />
      </div>

      <KpiCards summary={summary} comparison={comparison} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <MonthlyTrendChart data={trend} selectedYear={selected.year} selectedMonth={selected.month} />
        <CategoryDonut
          breakdown={breakdown}
          subBreakdowns={subBreakdowns}
          categoryTree={expenseCategoryTree}
          transactions={monthTransactions}
          totalExpense={summary.totalExpense}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CurrentDebtCard current={currentDebt} />
        <UpcomingInstallmentsCard summary={upcomingInstallments} />
        <SubscriptionsSummaryCard summary={subscriptions} />
      </div>
    </div>
  );
}
