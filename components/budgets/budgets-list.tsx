"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Progress as ProgressPrimitive } from "@base-ui/react/progress";
import type { Category } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressTrack, ProgressIndicator } from "@/components/ui/progress";
import { ConfirmDeleteButton } from "@/components/shared/confirm-delete-button";
import { BudgetFormDialog } from "./budget-form-dialog";
import { deleteBudgetAction } from "@/app/budgets/actions";
import { formatKurus } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { BudgetWithProgress } from "@/lib/db/budget.service";

type CategoryWithChildren = Category & { children: Category[] };

function progressColor(percent: number, exceeded: boolean): string {
  if (exceeded) return "bg-danger";
  if (percent >= 80) return "bg-warning";
  return "bg-primary";
}

export function BudgetsList({
  budgets,
  categories,
}: {
  budgets: BudgetWithProgress[];
  categories: CategoryWithChildren[];
}) {
  if (budgets.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Henüz bütçe tanımlanmadı. Bir kategori için aylık limit belirleyerek başlayın.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {budgets.map((b) => (
        <div key={b.id} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-block size-2.5 rounded-full" style={{ backgroundColor: b.categoryColor }} />
                <span className="font-medium">
                  {b.categoryName}
                  {b.subCategoryName ? ` / ${b.subCategoryName}` : ""}
                </span>
                {b.exceeded && (
                  <Badge variant="outline" className="text-danger">
                    Bütçe aşıldı
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatKurus(b.spent)} / {formatKurus(b.limitAmount)} — %{b.percent}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <BudgetFormDialog
                title="Bütçeyi düzenle"
                categories={categories}
                budget={{
                  id: b.id,
                  categoryId: b.categoryId,
                  subCategoryId: b.subCategoryId,
                  limitAmountTL: (b.limitAmount / 100).toFixed(2).replace(".", ","),
                }}
                trigger={
                  <Button variant="ghost" size="icon-sm">
                    <Pencil className="size-3.5" />
                    <span className="sr-only">Düzenle</span>
                  </Button>
                }
              />
              <ConfirmDeleteButton
                title="Bütçeyi sil"
                description={`"${b.categoryName}${b.subCategoryName ? ` / ${b.subCategoryName}` : ""}" bütçesini silmek istediğinize emin misiniz?`}
                action={() => deleteBudgetAction(b.id)}
                trigger={
                  <Button variant="ghost" size="icon-sm">
                    <Trash2 className="size-3.5" />
                    <span className="sr-only">Sil</span>
                  </Button>
                }
              />
            </div>
          </div>

          <ProgressPrimitive.Root value={Math.min(b.percent, 100)} className="mt-3">
            <ProgressTrack>
              <ProgressIndicator className={cn(progressColor(b.percent, b.exceeded))} />
            </ProgressTrack>
          </ProgressPrimitive.Root>
        </div>
      ))}
    </div>
  );
}
