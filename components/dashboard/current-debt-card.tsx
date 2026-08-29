import Link from "next/link";
import { CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function CurrentDebtCard({ current }: { current: { balance: number; statementDate: Date } | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CreditCard className="size-4" /> Güncel Kart Borcu
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {current === null ? (
          <p className="text-sm text-muted-foreground">Ekstre bilgisi bulunamadı.</p>
        ) : (
          <>
            <p className="text-2xl font-semibold">{formatKurus(current.balance)}</p>
            <p className="text-sm text-muted-foreground">
              {dateFormatter.format(current.statementDate)} tarihli ekstreye göre.{" "}
              <Link href="/statements" className="hover:underline">
                Detaylar
              </Link>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
