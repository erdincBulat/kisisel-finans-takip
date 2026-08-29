import { BarChart3 } from "lucide-react";
import { listStatements } from "@/lib/db/statement.service";
import { getMonthlyTrend, getLatestDataMonth } from "@/lib/analytics/monthly-summary";
import { getCategoryTrend } from "@/lib/analytics/category-trend";
import { getTopMerchants } from "@/lib/analytics/top-merchants";
import { getSubscriptionsSummary } from "@/lib/analytics/upcoming";
import { getInstallmentBurdenByMonth } from "@/lib/installments/calculations";
import { PageEmptyState } from "@/components/shared/page-empty-state";
import { MonthNav } from "@/components/dashboard/month-nav";
import { SubscriptionsSummaryCard } from "@/components/dashboard/subscriptions-summary-card";
import { UpcomingBurdenChart } from "@/components/installments/upcoming-burden-chart";
import { IncomeExpenseTrendChart } from "@/components/reports/income-expense-trend-chart";
import { CategoryTrendChart } from "@/components/reports/category-trend-chart";
import { TopMerchantsList } from "@/components/reports/top-merchants-list";
import { MonthlyComparisonTable } from "@/components/reports/monthly-comparison-table";

function parseMonthParam(raw: string | undefined): { year: number; month: number } | null {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export default async function ReportsPage(props: PageProps<"/reports">) {
  const searchParams = await props.searchParams;

  const statements = await listStatements();
  if (statements.length === 0) {
    return (
      <PageEmptyState
        icon={BarChart3}
        title="Henüz analiz edilecek veri yok."
        description="Raporlar, içe aktarılan ekstrelerdeki işlemlere göre oluşturulur. İlk Enpara ekstresini yükleyerek başlayabilirsin."
        ctaHref="/statements"
        ctaLabel="Ekstre Yükle"
      />
    );
  }

  const monthParam = typeof searchParams.month === "string" ? searchParams.month : undefined;
  const now = new Date();
  const fallback = { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
  const latest = (await getLatestDataMonth()) ?? fallback;
  const selected = parseMonthParam(monthParam) ?? latest;

  const [trend, categoryTrend, topMerchants, subscriptions, installmentBurden] = await Promise.all([
    getMonthlyTrend(selected.year, selected.month, 12),
    getCategoryTrend(selected.year, selected.month, 6),
    getTopMerchants(selected.year, selected.month, 10),
    getSubscriptionsSummary(selected.year, selected.month),
    getInstallmentBurdenByMonth(selected.year, selected.month, 6),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Raporlar</h1>
          <p className="text-sm text-muted-foreground">Aylık karşılaştırma, kategori trendleri ve harcama analizleri.</p>
        </div>
        <MonthNav year={selected.year} month={selected.month} />
      </div>

      <IncomeExpenseTrendChart data={trend} />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <CategoryTrendChart series={categoryTrend} />
        <TopMerchantsList merchants={topMerchants} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UpcomingBurdenChart data={installmentBurden} />
        <SubscriptionsSummaryCard summary={subscriptions} />
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">Aylık Karşılaştırma</h2>
        <MonthlyComparisonTable data={trend} />
      </div>
    </div>
  );
}
