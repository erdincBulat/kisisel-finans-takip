import Link from "next/link";
import type { Category, Transaction } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKurus } from "@/lib/money";

type TransactionRow = Transaction & { category: Category | null; subCategory: Category | null };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" });

export function RecentTransactions({
  transactions,
  monthParam,
}: {
  transactions: TransactionRow[];
  monthParam: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Son İşlemler</CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Bu ayda işlem bulunmuyor.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {transactions.map((tx) => {
              const category = tx.subCategory ?? tx.category;
              // PAYMENT (kredi kartı borç ödemesi) harcama/gelir değildir, nötr gösterilir.
              const sign = tx.type === "EXPENSE" ? "-" : tx.type === "PAYMENT" ? "" : "+";
              const amountClass =
                tx.type === "EXPENSE" ? "text-danger" : tx.type === "PAYMENT" ? "text-muted-foreground" : "text-success";

              return (
                <li key={tx.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium">{tx.description}</span>
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {dateFormatter.format(tx.date)}
                      {category && (
                        <Badge
                          variant="secondary"
                          className="px-1.5 py-0"
                          style={{ backgroundColor: `${category.color}1a`, color: category.color }}
                        >
                          {category.name}
                        </Badge>
                      )}
                    </span>
                  </div>
                  <span className={`shrink-0 text-sm font-medium ${amountClass}`}>
                    {sign}
                    {formatKurus(tx.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="pt-3 text-right text-sm">
          <Link href={`/transactions?month=${monthParam}`} className="text-primary hover:underline">
            Tüm işlemleri gör →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
