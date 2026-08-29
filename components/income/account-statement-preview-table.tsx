"use client";

import { useMemo } from "react";
import type { Category } from "@prisma/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatKurus } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { EditableAccountLine } from "./account-statement-import-flow";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

const CLASSIFICATION_ITEMS: Record<string, string> = {
  INCOME: "Gelir",
  EXCLUDED: "Hariç Tut",
};

export function AccountStatementPreviewTable({
  rows,
  incomeCategories,
  onClassificationChange,
  onCategoryChange,
}: {
  rows: EditableAccountLine[];
  incomeCategories: Category[];
  onClassificationChange: (index: number, classification: EditableAccountLine["classification"]) => void;
  onCategoryChange: (index: number, categoryId: string | null) => void;
}) {
  const categoryItems = useMemo(
    () => Object.fromEntries(incomeCategories.map((c) => [c.id, c.name])),
    [incomeCategories],
  );

  return (
    <div className="rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tarih</TableHead>
            <TableHead>Açıklama</TableHead>
            <TableHead>Sınıf</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Tutar</TableHead>
            <TableHead className="text-right">Bakiye</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => {
            const isIncome = row.classification === "INCOME";

            return (
              <TableRow key={index} className={!isIncome ? "opacity-50" : undefined}>
                <TableCell className="text-muted-foreground">{dateFormatter.format(row.date)}</TableCell>
                <TableCell className="max-w-80 truncate font-medium">{row.description}</TableCell>
                <TableCell>
                  <Select
                    items={CLASSIFICATION_ITEMS}
                    value={row.classification}
                    onValueChange={(v) => onClassificationChange(index, (v ?? "EXCLUDED") as EditableAccountLine["classification"])}
                  >
                    <SelectTrigger size="sm" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INCOME">Gelir</SelectItem>
                      <SelectItem value="EXCLUDED">Hariç Tut</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {isIncome ? (
                    <Select
                      items={categoryItems}
                      value={row.categoryId ?? ""}
                      onValueChange={(v) => onCategoryChange(index, v || null)}
                    >
                      <SelectTrigger size="sm" className={cn("w-40", !row.categoryId && "text-muted-foreground")}>
                        <SelectValue placeholder="Kategori seçilmedi" />
                      </SelectTrigger>
                      <SelectContent>
                        {incomeCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className={`text-right font-medium ${row.isOutgoing ? "text-danger" : "text-success"}`}>
                  {row.isOutgoing ? "-" : "+"}
                  {formatKurus(row.amount)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">{formatKurus(row.balanceAfter)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
