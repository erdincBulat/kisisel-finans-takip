import Link from "next/link";
import { formatKurus } from "@/lib/money";
import type { MonthPoint } from "@/lib/analytics/monthly-summary";

const MONTH_FULL = new Intl.DateTimeFormat("tr-TR", { month: "long" });

/** Yıl bazlı aylık harcama özeti (spec §32): bir aya tıklanınca o ayın dashboard'una gidilir. */
export function YearlySummaryList({ months }: { months: MonthPoint[] }) {
  return (
    <div className="rounded-lg border border-border">
      <ul className="divide-y divide-border">
        {months.map((m) => {
          const net = m.totalIncome - m.totalExpense;
          return (
            <li key={`${m.year}-${m.month}`}>
              <Link
                href={`/dashboard?month=${m.year}-${String(m.month).padStart(2, "0")}`}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <span className="font-medium capitalize">{MONTH_FULL.format(new Date(Date.UTC(m.year, m.month - 1, 1)))}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    Net: <span className={net >= 0 ? "text-success" : "text-danger"}>{formatKurus(net)}</span>
                  </span>
                  <span className="font-medium">{formatKurus(m.totalExpense)}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
