"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import type { InstallmentPlan } from "@/lib/installments/schedule";

const STATUS_LABEL: Record<string, string> = {
  REAL: "İçe aktarıldı",
  MISSING: "Ekstre yüklenmedi",
  PROJECTED: "Tahmini",
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function InstallmentDetailDialog({
  plan,
  open,
  onOpenChange,
}: {
  plan: InstallmentPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{plan.description}</DialogTitle>
          <DialogDescription>
            {dateFormatter.format(plan.purchaseDate)} tarihli alışveriş — {formatKurus(plan.totalAmount)} toplam,{" "}
            {plan.totalInstallments} taksit.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Taksit</TableHead>
                <TableHead>Ay</TableHead>
                <TableHead className="text-right">Tutar</TableHead>
                <TableHead>Durum</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plan.occurrences.map((occ) => (
                <TableRow key={occ.installmentCurrent}>
                  <TableCell className="font-medium">
                    {occ.installmentCurrent}/{plan.totalInstallments}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatMonthYear(occ.year, occ.month)}</TableCell>
                  <TableCell className="text-right">{formatKurus(occ.amount)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={occ.status === "REAL" ? "secondary" : "outline"}
                      className={occ.status === "PROJECTED" ? "text-muted-foreground" : undefined}
                    >
                      {STATUS_LABEL[occ.status]}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
