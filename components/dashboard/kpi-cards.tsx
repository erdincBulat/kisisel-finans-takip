import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import type { MonthlySummary } from "@/lib/analytics/monthly-summary";
import type { MonthComparison } from "@/lib/analytics/comparisons";

const percentFormatter = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

function ChangeBadge({ changePercent }: { changePercent: number | null }) {
  if (changePercent === null) {
    return <span className="text-xs text-muted-foreground">Geçen ay veri yok</span>;
  }

  const isIncrease = changePercent >= 0;
  const Icon = isIncrease ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${isIncrease ? "text-danger" : "text-success"}`}
    >
      <Icon className="size-3.5" />
      {percentFormatter.format(Math.abs(changePercent))}% geçen aya göre
    </span>
  );
}

export function KpiCards({ summary, comparison }: { summary: MonthlySummary; comparison: MonthComparison }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Gelir</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold text-success">{formatKurus(summary.totalIncome)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Toplam Harcama</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1">
          <p className="text-2xl font-semibold">{formatKurus(summary.totalExpense)}</p>
          <ChangeBadge changePercent={comparison.changePercent} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Net Durum</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-semibold ${summary.net >= 0 ? "text-success" : "text-danger"}`}>
            {formatKurus(summary.net)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">İşlem Sayısı</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold">{summary.transactionCount}</p>
        </CardContent>
      </Card>
    </div>
  );
}
