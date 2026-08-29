"use client";

import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import type { ValidationIssue } from "@/lib/pdf/types";
import { StatementPreviewTable } from "./statement-preview-table";
import type { EditableTransactionRow } from "./statement-import-flow";

type CategoryWithChildren = Category & { children: Category[] };

function computeNetTotal(rows: EditableTransactionRow[]): number {
  return rows.reduce((sum, r) => {
    if (r.type === "EXPENSE") return sum + r.amount;
    if (r.type === "REFUND") return sum - r.amount;
    return sum;
  }, 0);
}

/** İçe aktarma önizlemesi — özet, doğrulama uyarıları, düzenlenebilir tablo ve kaydet adımı (spec §18). */
export function StatementPreview({
  fileName,
  statement,
  rows,
  warnings,
  categories,
  saving,
  onCategoryChange,
  onSave,
  onCancel,
}: {
  fileName: string;
  statement: { year: number; month: number };
  rows: EditableTransactionRow[];
  warnings: ValidationIssue[];
  categories: CategoryWithChildren[];
  saving: boolean;
  onCategoryChange: (index: number, categoryId: string | null, subCategoryId: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const categorizable = rows.filter((r) => r.type !== "PAYMENT");
  const pendingCount = categorizable.filter((r) => !r.categoryId).length;
  const autoCount = categorizable.length - pendingCount;
  const total = computeNetTotal(rows);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{formatMonthYear(statement.year, statement.month)}</h1>
        <p className="text-sm text-muted-foreground">{fileName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="İşlem bulundu" value={`${rows.length}`} />
        <SummaryStat label="Toplam" value={formatKurus(total)} />
        <SummaryStat label="Otomatik kategorize" value={`${autoCount}`} />
        <SummaryStat label="Kategori bekleyen" value={`${pendingCount}`} accent={pendingCount > 0} />
      </div>

      {pendingCount > 0 && (
        <p className="text-sm text-warning">{pendingCount} işlem için kategori seçmeniz gerekiyor.</p>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <p className="mb-1 font-medium">Doğrulama uyarıları</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      <StatementPreviewTable rows={rows} categories={categories} onCategoryChange={onCategoryChange} />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Ekstreyi Kaydet"}
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-lg font-semibold ${accent ? "text-warning" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
