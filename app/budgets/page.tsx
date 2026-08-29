import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listBudgetsWithProgress } from "@/lib/db/budget.service";
import { listCategoryTree } from "@/lib/db/category.service";
import { getLatestDataMonth } from "@/lib/analytics/monthly-summary";
import { formatMonthYear } from "@/lib/format-date";
import { BudgetFormDialog } from "@/components/budgets/budget-form-dialog";
import { BudgetsList } from "@/components/budgets/budgets-list";

export default async function BudgetsPage() {
  const now = new Date();
  const { year, month } = (await getLatestDataMonth()) ?? { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };

  const [budgets, categoryTree] = await Promise.all([listBudgetsWithProgress(year, month), listCategoryTree()]);
  const expenseCategories = categoryTree.filter((c) => !c.isIncome);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bütçe</h1>
          <p className="text-sm text-muted-foreground">
            {formatMonthYear(year, month)} için kategori bazlı harcama limitleri ve ilerleme durumu.
          </p>
        </div>
        <BudgetFormDialog
          title="Yeni bütçe"
          categories={expenseCategories}
          trigger={
            <Button>
              <Plus className="size-4" /> Yeni Bütçe
            </Button>
          }
        />
      </div>

      <BudgetsList budgets={budgets} categories={expenseCategories} />
    </div>
  );
}
