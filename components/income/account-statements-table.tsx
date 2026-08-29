import type { AccountStatement } from "@prisma/client";
import { Landmark, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { deleteAccountStatementAction } from "@/app/income/account-actions";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";

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

export function AccountStatementsTable({ statements }: { statements: AccountStatement[] }) {
  if (statements.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
        <Landmark className="size-8 text-muted-foreground" />
        <p className="text-sm font-medium">Henüz hesap özeti yüklenmedi.</p>
        <p className="text-sm text-muted-foreground">
          Yukarıdaki alandan Enpara vadesiz TL hesap özetini yükleyerek başlayabilirsin.
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
            <TableHead className="text-right">Hareket Sayısı</TableHead>
            <TableHead className="text-right">Dönem Başı</TableHead>
            <TableHead className="text-right">Dönem Sonu</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Yüklenme Tarihi</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {statements.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{formatMonthYear(s.year, s.month)}</TableCell>
              <TableCell className="max-w-64 truncate text-muted-foreground">{s.fileName}</TableCell>
              <TableCell className="text-right text-muted-foreground">{s.lineCount}</TableCell>
              <TableCell className="text-right text-muted-foreground">{formatKurus(s.openingBalance)}</TableCell>
              <TableCell className="text-right font-medium">{formatKurus(s.closingBalance)}</TableCell>
              <TableCell>
                <Badge variant={s.status === "IMPORTED" ? "secondary" : "outline"}>
                  {STATUS_LABEL[s.status] ?? s.status}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{uploadedAtFormatter.format(s.uploadedAt)}</TableCell>
              <TableCell>
                <ConfirmDeleteButton
                  title="Hesap özetini sil"
                  description={`${formatMonthYear(s.year, s.month)} hesap özetini ve bu özetten eklenen tüm gelir kayıtlarını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
                  action={deleteAccountStatementAction.bind(null, s.id)}
                  trigger={
                    <Button variant="ghost" size="icon-sm">
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Sil</span>
                    </Button>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
