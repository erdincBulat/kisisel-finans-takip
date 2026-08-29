"use client";

import type { Category, Income } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { IncomeFormDialog } from "./income-form-dialog";
import { deleteIncomeAction } from "@/app/income/actions";
import { formatKurus } from "@/lib/money";

type IncomeRow = Income & { category: Category | null };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

export function IncomeTable({ incomes, categories }: { incomes: IncomeRow[]; categories: Category[] }) {
  if (incomes.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Henüz gelir kaydı yok.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead className="w-20" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {incomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell className="text-muted-foreground">{dateFormatter.format(income.date)}</TableCell>
              <TableCell className="max-w-64 truncate font-medium">{income.description}</TableCell>
              <TableCell>
                {income.category ? (
                  <Badge
                    variant="secondary"
                    style={{ backgroundColor: `${income.category.color}1a`, color: income.category.color }}
                  >
                    {income.category.name}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-right font-medium text-success">
                +{formatKurus(income.amount)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <IncomeFormDialog
                    title="Geliri düzenle"
                    categories={categories}
                    income={{
                      id: income.id,
                      date: income.date.toISOString().slice(0, 10),
                      description: income.description,
                      amountTL: (income.amount / 100).toFixed(2).replace(".", ","),
                      categoryId: income.categoryId,
                      notes: income.notes,
                    }}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Pencil className="size-3.5" />
                        <span className="sr-only">Düzenle</span>
                      </Button>
                    }
                  />
                  <ConfirmDeleteButton
                    title="Geliri sil"
                    description={`"${income.description}" gelir kaydını silmek istediğinize emin misiniz?`}
                    action={() => deleteIncomeAction(income.id)}
                    trigger={
                      <Button variant="ghost" size="icon-sm">
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Sil</span>
                      </Button>
                    }
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
