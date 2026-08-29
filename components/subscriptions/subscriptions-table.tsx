import type { ReactNode } from "react";
import type { Subscription } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKurus } from "@/lib/money";
import type { SubscriptionWithCategory } from "@/lib/subscriptions/subscription.service";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

const frequencyLabel: Record<Subscription["frequency"], string> = {
  MONTHLY: "Aylık",
  YEARLY: "Yıllık",
  UNKNOWN: "Bilinmiyor",
};

export function SubscriptionsTable({
  subscriptions,
  emptyMessage,
  renderActions,
}: {
  subscriptions: SubscriptionWithCategory[];
  emptyMessage: string;
  renderActions: (subscription: SubscriptionWithCategory) => ReactNode;
}) {
  if (subscriptions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Merchant</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Sıklık</TableHead>
            <TableHead className="text-right">Ortalama Tutar</TableHead>
            <TableHead>Son Ödeme</TableHead>
            <TableHead>Sıradaki Ödeme</TableHead>
            <TableHead className="w-px" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell className="font-medium">{subscription.merchant}</TableCell>
              <TableCell>
                {subscription.category ? (
                  <Badge
                    variant="outline"
                    style={{ backgroundColor: `${subscription.category.color}1a`, color: subscription.category.color }}
                  >
                    {subscription.category.name}
                  </Badge>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{frequencyLabel[subscription.frequency]}</Badge>
              </TableCell>
              <TableCell className="text-right">{formatKurus(subscription.averageAmount)}</TableCell>
              <TableCell className="text-muted-foreground">{dateFormatter.format(subscription.lastChargeDate)}</TableCell>
              <TableCell className="text-muted-foreground">{dateFormatter.format(subscription.nextExpectedDate)}</TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1.5">{renderActions(subscription)}</div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
