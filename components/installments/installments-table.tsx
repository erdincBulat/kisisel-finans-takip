"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import { InstallmentDetailDialog } from "./installment-detail-dialog";
import type { InstallmentPlan } from "@/lib/installments/schedule";

export function InstallmentsTable({ plans, emptyMessage }: { plans: InstallmentPlan[]; emptyMessage: string }) {
  const [openPlanKey, setOpenPlanKey] = useState<string | null>(null);
  const openPlan = plans.find((p) => p.planKey === openPlanKey) ?? null;

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Açıklama</TableHead>
              <TableHead>Taksit</TableHead>
              <TableHead className="text-right">Taksit Tutarı</TableHead>
              <TableHead className="text-right">Kalan Tutar</TableHead>
              <TableHead>Sıradaki Ödeme</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => {
              const nextOccurrence = plan.occurrences.find(
                (o) => o.installmentCurrent === plan.latestKnownInstallment + 1,
              );

              return (
                <TableRow key={plan.planKey}>
                  <TableCell className="max-w-64 truncate font-medium">{plan.description}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {plan.latestKnownInstallment}/{plan.totalInstallments}
                  </TableCell>
                  <TableCell className="text-right">{formatKurus(plan.installmentAmount)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {plan.remainingAmount > 0 ? formatKurus(plan.remainingAmount) : "-"}
                  </TableCell>
                  <TableCell>
                    {nextOccurrence ? (
                      formatMonthYear(nextOccurrence.year, nextOccurrence.month)
                    ) : (
                      <Badge variant="secondary">Tamamlandı</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" onClick={() => setOpenPlanKey(plan.planKey)}>
                      <Eye className="size-3.5" />
                      <span className="sr-only">Detay</span>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {openPlan && (
        <InstallmentDetailDialog
          plan={openPlan}
          open={openPlanKey !== null}
          onOpenChange={(open) => setOpenPlanKey(open ? openPlanKey : null)}
        />
      )}
    </>
  );
}
