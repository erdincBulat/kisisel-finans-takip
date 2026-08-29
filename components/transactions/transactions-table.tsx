"use client";

import { useMemo, useState } from "react";
import type { Category, Transaction } from "@prisma/client";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { TransactionFormDialog } from "./transaction-form-dialog";
import { BulkCategoryBar } from "./bulk-category-bar";
import { deleteTransactionAction } from "@/app/transactions/actions";
import { formatKurus } from "@/lib/money";

type CategoryWithChildren = Category & { children: Category[] };
type TransactionRow = Transaction & { category: Category | null; subCategory: Category | null };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

const SOURCE_LABEL: Record<string, string> = { MANUAL: "Manuel", STATEMENT: "Ekstre" };

export function TransactionsTable({
  transactions,
  categories,
  subscribedMerchants,
}: {
  transactions: TransactionRow[];
  categories: CategoryWithChildren[];
  subscribedMerchants: string[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const subscribedMerchantSet = useMemo(() => new Set(subscribedMerchants), [subscribedMerchants]);

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Bu filtrelerle eşleşen işlem bulunamadı.
      </div>
    );
  }

  const allSelected = selected.size === transactions.length;

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(transactions.map((t) => t.id)));
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {selected.size > 0 && (
        <BulkCategoryBar
          selectedIds={[...selected]}
          categories={categories}
          onDone={() => setSelected(new Set())}
        />
      )}
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                <span className="sr-only">Tümünü seç</span>
              </TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Taksit</TableHead>
              <TableHead>Kaynak</TableHead>
              <TableHead className="text-right">Tutar</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => {
              const isNegative = tx.type === "EXPENSE";
              const category = tx.subCategory ?? tx.category;

              return (
                <TableRow key={tx.id} data-selected={selected.has(tx.id) || undefined}>
                  <TableCell>
                    <Checkbox checked={selected.has(tx.id)} onCheckedChange={() => toggleOne(tx.id)} />
                    <span className="sr-only">Seç</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{dateFormatter.format(tx.date)}</TableCell>
                <TableCell className="max-w-64 truncate font-medium">{tx.description}</TableCell>
                <TableCell>
                  {category ? (
                    <Badge
                      variant="secondary"
                      style={{ backgroundColor: `${category.color}1a`, color: category.color }}
                    >
                      {category.name}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-warning">
                      Kategori seçilmedi
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {tx.installmentCurrent && tx.installmentTotal
                    ? `${tx.installmentCurrent}/${tx.installmentTotal}`
                    : "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">{SOURCE_LABEL[tx.source] ?? tx.source}</TableCell>
                <TableCell className={`text-right font-medium ${isNegative ? "text-danger" : "text-success"}`}>
                  {isNegative ? "-" : "+"}
                  {formatKurus(tx.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <TransactionFormDialog
                      title="İşlemi düzenle"
                      categories={categories}
                      transaction={{
                        id: tx.id,
                        date: tx.date.toISOString().slice(0, 10),
                        description: tx.description,
                        normalizedMerchant: tx.normalizedMerchant,
                        amountTL: (tx.amount / 100).toFixed(2).replace(".", ","),
                        type: tx.type === "REFUND" ? "REFUND" : "EXPENSE",
                        categoryId: tx.categoryId,
                        subCategoryId: tx.subCategoryId,
                        installmentCurrent: tx.installmentCurrent,
                        installmentTotal: tx.installmentTotal,
                        notes: tx.notes,
                        isSubscription: subscribedMerchantSet.has(tx.normalizedMerchant),
                      }}
                      trigger={
                        <Button variant="ghost" size="icon-sm">
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Düzenle</span>
                        </Button>
                      }
                    />
                    <ConfirmDeleteButton
                      title="İşlemi sil"
                      description={`"${tx.description}" işlemini silmek istediğinize emin misiniz?`}
                      action={() => deleteTransactionAction(tx.id)}
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
            );
          })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
