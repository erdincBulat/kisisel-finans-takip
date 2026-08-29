import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import type { TopMerchant } from "@/lib/analytics/top-merchants";

/** En çok harcama yapılan merchant'lar (spec §55). */
export function TopMerchantsList({ merchants }: { merchants: TopMerchant[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">En Çok Harcama Yapılan Merchant&apos;lar</CardTitle>
      </CardHeader>
      <CardContent>
        {merchants.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Bu ay için harcama bulunmuyor.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {merchants.map((m, index) => (
              <li key={m.merchant} className="flex items-center justify-between gap-3 py-2.5 text-sm first:pt-0 last:pb-0">
                <span className="flex items-center gap-2.5 truncate">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="truncate font-medium">{m.merchant}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
                  <span>{m.count} işlem</span>
                  <span className="font-medium text-foreground">{formatKurus(m.amount)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
