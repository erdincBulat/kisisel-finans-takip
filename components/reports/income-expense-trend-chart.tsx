"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import type { MonthPoint } from "@/lib/analytics/monthly-summary";

const MONTH_SHORT = new Intl.DateTimeFormat("tr-TR", { month: "short" });
const axisNumberFormatter = new Intl.NumberFormat("tr-TR");

/** Gelir/Gider aylık karşılaştırma grafiği (spec §55 "Gelir / Gider"). */
export function IncomeExpenseTrendChart({ data }: { data: MonthPoint[] }) {
  const chartData = data.map((p) => ({
    label: MONTH_SHORT.format(new Date(Date.UTC(p.year, p.month - 1, 1))),
    fullLabel: formatMonthYear(p.year, p.month),
    gelirTL: p.totalIncome / 100,
    giderTL: p.totalExpense / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Gelir / Gider</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} className="text-xs fill-muted-foreground" />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={64}
              tickFormatter={(value) => axisNumberFormatter.format(Number(value))}
              className="text-xs fill-muted-foreground"
            />
            <Tooltip
              formatter={(value) => formatKurus(Math.round(Number(value) * 100))}
              labelFormatter={(_, payload) => payload[0]?.payload?.fullLabel ?? ""}
              labelClassName="text-foreground"
            />
            <Legend
              formatter={(value) => (value === "gelirTL" ? "Gelir" : "Gider")}
              wrapperStyle={{ fontSize: 12 }}
            />
            <Bar dataKey="gelirTL" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="giderTL" fill="var(--color-danger)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
