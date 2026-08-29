"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import type { MonthlyInstallmentBurden } from "@/lib/installments/calculations";

const MONTH_SHORT = new Intl.DateTimeFormat("tr-TR", { month: "short" });
const axisNumberFormatter = new Intl.NumberFormat("tr-TR");

/** Gelecek ay bazlı taksit yükü (spec §24). */
export function UpcomingBurdenChart({ data }: { data: MonthlyInstallmentBurden[] }) {
  const chartData = data.map((p) => ({
    label: MONTH_SHORT.format(new Date(Date.UTC(p.year, p.month - 1, 1))),
    tutarTL: p.total / 100,
  }));

  const hasData = data.some((p) => p.total > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Gelecek Taksit Yükü</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Önümüzdeki aylarda düşecek taksit bulunmuyor.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
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
                labelClassName="text-foreground"
              />
              <Bar dataKey="tutarTL" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
