import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import type { UpcomingInstallmentsSummary } from "@/lib/analytics/upcoming";

export function UpcomingInstallmentsCard({ summary }: { summary: UpcomingInstallmentsSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarClock className="size-4" /> Gelecek Taksitler
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {summary.activeCount === 0 ? (
          <p className="text-sm text-muted-foreground">Aktif taksitli işlem bulunmuyor.</p>
        ) : (
          <>
            <p className="text-2xl font-semibold">{formatKurus(summary.nextMonthTotal)}</p>
            <p className="text-sm text-muted-foreground">
              Önümüzdeki ay {summary.activeCount} taksitli işlemden düşecek tahmini tutar.{" "}
              <Link href="/installments" className="hover:underline">
                Detaylar
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
