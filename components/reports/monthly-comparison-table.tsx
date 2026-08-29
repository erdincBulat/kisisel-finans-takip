import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import type { MonthPoint } from "@/lib/analytics/monthly-summary";

/** Son N ayın gelir/gider/net tablosu + bir önceki aya göre harcama değişimi (spec §55 "Aylık Karşılaştırma"). */
export function MonthlyComparisonTable({ data }: { data: MonthPoint[] }) {
  const rows = data.map((p, index) => {
    const prev = index > 0 ? data[index - 1] : null;
    const changePercent = prev && prev.totalExpense > 0 ? ((p.totalExpense - prev.totalExpense) / prev.totalExpense) * 100 : null;
    return { ...p, changePercent };
  });

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ay</TableHead>
            <TableHead className="text-right">Gelir</TableHead>
            <TableHead className="text-right">Gider</TableHead>
            <TableHead className="text-right">Net</TableHead>
            <TableHead className="text-right">Geçen Aya Göre</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => {
            const net = r.totalIncome - r.totalExpense;
            return (
              <TableRow key={`${r.year}-${r.month}`}>
                <TableCell className="font-medium">{formatMonthYear(r.year, r.month)}</TableCell>
                <TableCell className="text-right text-success">{formatKurus(r.totalIncome)}</TableCell>
                <TableCell className="text-right text-danger">{formatKurus(r.totalExpense)}</TableCell>
                <TableCell className={`text-right font-medium ${net >= 0 ? "text-success" : "text-danger"}`}>
                  {formatKurus(net)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {r.changePercent === null ? (
                    "—"
                  ) : (
                    <span className={r.changePercent >= 0 ? "text-danger" : "text-success"}>
                      {r.changePercent >= 0 ? "+" : ""}
                      {r.changePercent.toFixed(1)}%
                    </span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
