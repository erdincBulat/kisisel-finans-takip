"use client";

import { useState } from "react";
import type { Category, Transaction } from "@prisma/client";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatKurus } from "@/lib/money";
import type { CategoryBreakdownItem } from "@/lib/analytics/category-breakdown";

type CategoryTreeNode = Category & { children: Category[] };
type TransactionRow = Transaction & { category: Category | null; subCategory: Category | null };

const dateFormatter = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "2-digit" });
const ALL_VALUE = "all";

type SelectedInfo = { kind: "main" | "sub"; id: string; name: string; color: string; amount: number };

function findSelectedInfo(
  selected: string,
  categoryTree: CategoryTreeNode[],
  breakdown: CategoryBreakdownItem[],
  subBreakdowns: Record<string, CategoryBreakdownItem[]>,
): SelectedInfo | null {
  if (selected === ALL_VALUE) return null;

  for (const cat of categoryTree) {
    if (cat.id === selected) {
      const amount = breakdown.find((b) => b.categoryId === selected)?.amount ?? 0;
      return { kind: "main", id: cat.id, name: cat.name, color: cat.color, amount };
    }
    const child = cat.children.find((c) => c.id === selected);
    if (child) {
      const parentSub = subBreakdowns[cat.id] ?? [];
      const amount = parentSub.find((s) => s.categoryId === selected)?.amount ?? 0;
      return { kind: "sub", id: child.id, name: child.name, color: child.color, amount };
    }
  }
  return null;
}

function BreakdownChart({ data }: { data: CategoryBreakdownItem[] }) {
  const total = data.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={200} className="sm:max-w-52">
        <PieChart>
          <Pie data={data} dataKey="amount" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.categoryId ?? "uncategorized"} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatKurus(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="flex flex-1 flex-col gap-1.5 text-sm">
        {data.map((entry) => (
          <li key={entry.categoryId ?? "uncategorized"} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 truncate">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatKurus(entry.amount)}
              {total > 0 && <span className="ml-1">({Math.round((entry.amount / total) * 100)}%)</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TransactionMiniList({ transactions }: { transactions: TransactionRow[] }) {
  if (transactions.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Bu kategoride bu ay işlem bulunmuyor.</p>;
  }

  const visible = transactions.slice(0, 5);
  const remaining = transactions.length - visible.length;

  return (
    <ul className="flex flex-col divide-y divide-border">
      {visible.map((tx) => (
        <li key={tx.id} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0">
          <span className="truncate">{tx.description}</span>
          <span className="flex shrink-0 items-center gap-2 text-muted-foreground">
            {dateFormatter.format(tx.date)}
            <span className={tx.type === "EXPENSE" ? "text-danger" : "text-success"}>{formatKurus(tx.amount)}</span>
          </span>
        </li>
      ))}
      {remaining > 0 && <li className="pt-2 text-xs text-muted-foreground">+{remaining} işlem daha</li>}
    </ul>
  );
}

export function CategoryDonut({
  breakdown,
  subBreakdowns,
  categoryTree,
  transactions,
  totalExpense,
}: {
  breakdown: CategoryBreakdownItem[];
  subBreakdowns: Record<string, CategoryBreakdownItem[]>;
  categoryTree: CategoryTreeNode[];
  transactions: TransactionRow[];
  totalExpense: number;
}) {
  const [selected, setSelected] = useState<string>(ALL_VALUE);

  const items: Record<string, string> = { [ALL_VALUE]: "Tüm Kategoriler" };
  for (const cat of categoryTree) {
    items[cat.id] = cat.name;
    for (const child of cat.children) items[child.id] = child.name;
  }

  const selectedInfo = findSelectedInfo(selected, categoryTree, breakdown, subBreakdowns);
  const subData = selectedInfo?.kind === "main" ? (subBreakdowns[selectedInfo.id] ?? []) : [];

  const filteredTransactions = !selectedInfo
    ? []
    : transactions.filter((t) =>
        selectedInfo.kind === "sub" ? t.subCategoryId === selectedInfo.id : t.categoryId === selectedInfo.id,
      );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Kategori Dağılımı</CardTitle>
        <CardAction>
          <Select items={items} value={selected} onValueChange={(value) => setSelected(value ?? ALL_VALUE)}>
            <SelectTrigger size="sm" className="w-44">
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_VALUE}>Tüm Kategoriler</SelectItem>
              <SelectSeparator />
              {categoryTree.map((cat) => (
                <SelectGroup key={cat.id}>
                  <SelectItem value={cat.id}>{cat.name}</SelectItem>
                  {cat.children.map((child) => (
                    <SelectItem key={child.id} value={child.id} className="pl-6 text-muted-foreground">
                      {child.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {selectedInfo && (
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="flex items-center gap-2 truncate font-medium">
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: selectedInfo.color }} />
              <span className="truncate">{selectedInfo.name}</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {formatKurus(selectedInfo.amount)}
              {totalExpense > 0 && (
                <span className="ml-1">({Math.round((selectedInfo.amount / totalExpense) * 100)}% bu ayın toplamından)</span>
              )}
            </span>
          </div>
        )}

        {selected === ALL_VALUE ? (
          breakdown.length === 0 ? (
            <p className="py-14 text-center text-sm text-muted-foreground">Bu ay için harcama bulunmuyor.</p>
          ) : (
            <BreakdownChart data={breakdown} />
          )
        ) : selectedInfo?.kind === "main" && subData.length > 0 ? (
          <BreakdownChart data={subData} />
        ) : (
          <TransactionMiniList transactions={filteredTransactions} />
        )}
      </CardContent>
    </Card>
  );
}
