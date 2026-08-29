"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import type { CategoryTrendSeries } from "@/lib/analytics/category-trend";

const MONTH_SHORT = new Intl.DateTimeFormat("tr-TR", { month: "short" });
const axisNumberFormatter = new Intl.NumberFormat("tr-TR");

function monthKey(year: number, month: number) {
  return `${year}-${month}`;
}

/** En çok harcanan kategorilerin ay bazlı yığılmış (stacked) harcama serisi (spec §55, Faz 11 "kategori trend"). */
export function CategoryTrendChart({ series }: { series: CategoryTrendSeries[] }) {
  if (series.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Kategori Trendi</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-14 text-center text-sm text-muted-foreground">Bu dönemde harcama bulunmuyor.</p>
        </CardContent>
      </Card>
    );
  }

  const months = series[0].points.map((p) => ({ year: p.year, month: p.month }));
  const chartData = months.map((m) => {
    const row: Record<string, string | number> = {
      label: MONTH_SHORT.format(new Date(Date.UTC(m.year, m.month - 1, 1))),
      fullLabel: formatMonthYear(m.year, m.month),
    };
    for (const s of series) {
      const point = s.points.find((p) => monthKey(p.year, p.month) === monthKey(m.year, m.month));
      row[s.categoryId] = (point?.amount ?? 0) / 100;
    }
    return row;
  });

  const nameById = new Map(series.map((s) => [s.categoryId, s.name]));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Kategori Trendi</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
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
              formatter={(value, name) => [formatKurus(Math.round(Number(value) * 100)), nameById.get(String(name)) ?? String(name)]}
              labelFormatter={(_, payload) => payload[0]?.payload?.fullLabel ?? ""}
              labelClassName="text-foreground"
            />
            <Legend formatter={(value) => nameById.get(String(value)) ?? String(value)} wrapperStyle={{ fontSize: 12 }} />
            {series.map((s) => (
              <Bar key={s.categoryId} dataKey={s.categoryId} stackId="categories" fill={s.color} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
