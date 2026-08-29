"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import type { MonthPoint } from "@/lib/analytics/monthly-summary";

const MONTH_SHORT = new Intl.DateTimeFormat("tr-TR", { month: "short" });
const axisNumberFormatter = new Intl.NumberFormat("tr-TR");

/**
 * `data` her zaman 12 aylık tutulur; 6/12 ay geçişi ekstra sorgu atmadan
 * client'ta dilimlenir. Bir çubuğa tıklamak o ayı dashboard'un geneli için
 * seçili aya çevirir (`?month=YYYY-MM`) — böylece "seçilen ay detayları"
 * zaten KPI/kategori/son işlemler kartlarında görünür; seçili ay çubuğu
 * ayrıca vurgulanır.
 */
export function MonthlyTrendChart({
  data,
  selectedYear,
  selectedMonth,
}: {
  data: MonthPoint[];
  selectedYear: number;
  selectedMonth: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [range, setRange] = useState<6 | 12>(6);
  const visible = data.slice(-range);
  const chartData = visible.map((p) => ({
    label: MONTH_SHORT.format(new Date(Date.UTC(p.year, p.month - 1, 1))),
    fullLabel: formatMonthYear(p.year, p.month),
    harcamaTL: p.totalExpense / 100,
    year: p.year,
    month: p.month,
    isSelected: p.year === selectedYear && p.month === selectedMonth,
  }));

  function selectMonth(year: number, month: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", `${year}-${String(month).padStart(2, "0")}`);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Harcama Trendi</CardTitle>
        <CardAction>
          <div className="flex gap-1">
            <Button variant={range === 6 ? "secondary" : "ghost"} size="sm" onClick={() => setRange(6)}>
              6 Ay
            </Button>
            <Button variant={range === 12 ? "secondary" : "ghost"} size="sm" onClick={() => setRange(12)}>
              12 Ay
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
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
            <Bar
              dataKey="harcamaTL"
              radius={[4, 4, 0, 0]}
              className="cursor-pointer"
              onClick={(item) => {
                const point = item.payload as { year: number; month: number };
                selectMonth(point.year, point.month);
              }}
            >
              {chartData.map((point) => (
                <Cell
                  key={`${point.year}-${point.month}`}
                  fill="var(--color-primary)"
                  fillOpacity={point.isSelected ? 1 : 0.45}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
