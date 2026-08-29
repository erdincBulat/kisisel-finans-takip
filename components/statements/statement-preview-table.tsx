"use client";

import { useMemo } from "react";
import type { Category } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatKurus } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { EditableTransactionRow } from "./statement-import-flow";

type CategoryWithChildren = Category & { children: Category[] };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

const TYPE_LABEL: Record<string, string> = { EXPENSE: "Harcama", REFUND: "İade", PAYMENT: "Ödeme" };

/** Kategori Select'i için "parentId" (üst düzey) veya "parentId:childId" (alt kategori) biçiminde tekil değer üretir. */
function optionValue(categoryId: string, subCategoryId: string | null) {
  return subCategoryId ? `${categoryId}:${subCategoryId}` : categoryId;
}

export function StatementPreviewTable({
  rows,
  categories,
  onCategoryChange,
}: {
  rows: EditableTransactionRow[];
  categories: CategoryWithChildren[];
  onCategoryChange: (index: number, categoryId: string | null, subCategoryId: string | null) => void;
}) {
  const categoryItems = useMemo(() => {
    const items: Record<string, string> = {};
    for (const cat of categories) {
      items[cat.id] = cat.name;
      for (const child of cat.children) {
        items[optionValue(cat.id, child.id)] = `${cat.name} / ${child.name}`;
      }
    }
    return items;
  }, [categories]);

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Tür</TableHead>
            <TableHead>Taksit</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const isPayment = row.type === "PAYMENT";
            const selectValue = row.categoryId ? optionValue(row.categoryId, row.subCategoryId) : "";

            return (
              <TableRow key={index}>
                <TableCell className="text-muted-foreground">{dateFormatter.format(row.date)}</TableCell>
                <TableCell className="max-w-72">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{row.description}</span>
                    {row.isBankFee && (
                      <Badge variant="outline" className="shrink-0 text-xs">
                        Ücret
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{TYPE_LABEL[row.type] ?? row.type}</TableCell>
                <TableCell className="text-muted-foreground">
                  {row.installmentCurrent && row.installmentTotal
                    ? `${row.installmentCurrent}/${row.installmentTotal}`
                    : "-"}
                </TableCell>
                <TableCell>
                  {isPayment ? (
                    <span className="text-sm text-muted-foreground">Kategori gerekmez</span>
                  ) : (
                    <Select
                      items={categoryItems}
                      value={selectValue}
                      onValueChange={(v) => {
                        if (!v) {
                          onCategoryChange(index, null, null);
                          return;
                        }
                        const [categoryId, subCategoryId] = v.split(":");
                        onCategoryChange(index, categoryId, subCategoryId ?? null);
                      }}
                    >
                      <SelectTrigger
                        size="sm"
                        className={cn("w-48", !row.categoryId && "border-warning/40 text-warning")}
                      >
                        <SelectValue placeholder="Kategori seçilmedi" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectGroup key={cat.id}>
                            <SelectLabel>{cat.name}</SelectLabel>
                            <SelectItem value={cat.id}>{cat.name} (genel)</SelectItem>
                            {cat.children.map((child) => (
                              <SelectItem key={child.id} value={optionValue(cat.id, child.id)}>
                                {child.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    row.type === "EXPENSE" ? "text-danger" : row.type === "REFUND" ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {row.type === "EXPENSE" ? "-" : row.type === "REFUND" ? "+" : ""}
                  {formatKurus(row.amount)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
