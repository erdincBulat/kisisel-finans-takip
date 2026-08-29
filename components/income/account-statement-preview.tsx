"use client";

import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatKurus } from "@/lib/money";
import { formatMonthYear } from "@/lib/format-date";
import { AccountStatementPreviewTable } from "./account-statement-preview-table";
import type { EditableAccountLine } from "./account-statement-import-flow";

export function AccountStatementPreview({
  fileName,
  statement,
  rows,
  warnings,
  incomeCategories,
  saving,
  onClassificationChange,
  onCategoryChange,
  onSave,
  onCancel,
}: {
  fileName: string;
  statement: { year: number; month: number; openingBalance: number; closingBalance: number };
  rows: EditableAccountLine[];
  warnings: string[];
  incomeCategories: Category[];
  saving: boolean;
  onClassificationChange: (index: number, classification: EditableAccountLine["classification"]) => void;
  onCategoryChange: (index: number, categoryId: string | null) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const incomeCount = rows.filter((r) => r.classification === "INCOME").length;
  const excludedCount = rows.length - incomeCount;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{formatMonthYear(statement.year, statement.month)} — Hesap Özeti</h1>
        <p className="text-sm text-muted-foreground">{fileName}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Hareket bulundu" value={`${rows.length}`} />
        <SummaryStat label="Gelir olarak kaydedilecek" value={`${incomeCount}`} />
        <SummaryStat label="Hariç tutulan" value={`${excludedCount}`} />
        <SummaryStat label="Dönem sonu bakiye" value={formatKurus(statement.closingBalance)} />
      </div>

      <p className="text-sm text-muted-foreground">
        Yalnızca <span className="font-medium text-foreground">Gelir</span> olarak işaretlenen satırlar kaydedilir —
        hesaptan çıkan hareketler (EFT, harcama, ATM vb.) hariç tutulur ve işlemlere/dashboard&apos;a hiç yansımaz.
        Aşağıdaki liste yalnızca bakiyenin doğru hesaplandığını görebilmeniz için tam gösterilir.
      </p>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <p className="mb-1 font-medium">Doğrulama uyarıları</p>
          <ul className="list-disc space-y-0.5 pl-4">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <AccountStatementPreviewTable
        rows={rows}
        incomeCategories={incomeCategories}
        onClassificationChange={onClassificationChange}
        onCategoryChange={onCategoryChange}
      />

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Vazgeç
        </Button>
        <Button type="button" onClick={onSave} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Hesap Özetini Kaydet"}
        </Button>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <Card size="sm">
      <CardContent>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
