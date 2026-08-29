import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import type { SubscriptionsSummary } from "@/lib/analytics/upcoming";

export function SubscriptionsSummaryCard({ summary }: { summary: SubscriptionsSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <RefreshCw className="size-4" /> Aylık Abonelikler
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {summary.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz onaylanmış abonelik yok.{" "}
            <Link href="/subscriptions" className="hover:underline">
              Muhtemel abonelikleri gör
            </Link>
          </p>
        ) : (
          <>
            <p className="text-2xl font-semibold">{formatKurus(summary.monthlyTotal)}</p>
            <p className="text-sm text-muted-foreground">
              Bu ayki abonelik/fatura toplamı ({summary.items.length} abonelik
              {summary.estimatedCount > 0 ? `, ${summary.estimatedCount} tanesi henüz faturalanmadı — tahmini` : ""}
              ).{" "}
              <Link href="/subscriptions" className="hover:underline">
                Detaylar
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
