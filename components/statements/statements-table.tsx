import Link from "next/link";
import { FileStack } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import type { StatementWithBalance } from "@/lib/db/statement.service";

const uploadedAtFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_LABEL: Record<string, string> = {
  IMPORTED: "İçe aktarıldı",
  PENDING: "Bekliyor",
  FAILED: "Başarısız",
};

export function StatementsTable({ statements }: { statements: StatementWithBalance[] }) {
  if (statements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
        <FileStack className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Henüz ekstre yüklenmedi.</p>
        <p className="text-sm text-muted-foreground">
          Yukarıdaki alandan ilk Enpara kredi kartı ekstreni yükleyerek başlayabilirsin.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Dönem</TableHead>
            <TableHead>Dosya</TableHead>
            <TableHead className="text-right">İşlem Sayısı</TableHead>
            <TableHead className="text-right">Toplam</TableHead>
            <TableHead className="text-right">Ödeme</TableHead>
            <TableHead className="text-right">Dönem Sonu Borç</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Yüklenme Tarihi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">
                <Link
                  href={`/transactions?month=${s.year}-${String(s.month).padStart(2, "0")}`}
                  className="hover:underline"
                >
                  {formatMonthYear(s.year, s.month)}
                </Link>
              </TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">{s.fileName}</TableCell>
              <TableCell className="text-right text-muted-foreground">{s.transactionCount}</TableCell>
              <TableCell className="text-right font-medium">{formatKurus(s.totalAmount)}</TableCell>
              <TableCell className="text-right text-success">
                {s.paymentsTotal > 0 ? formatKurus(s.paymentsTotal) : "-"}
              </TableCell>
              <TableCell className="text-right font-medium">
                {s.endingBalance != null ? formatKurus(s.endingBalance) : "-"}
              </TableCell>
              <TableCell>
                <Badge variant={s.status === "IMPORTED" ? "secondary" : "outline"}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{uploadedAtFormatter.format(s.uploadedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
