import { listCategoryTree } from "@/lib/db/category.service";
import { StatementImportFlow } from "@/components/statements/statement-import-flow";

export default async function StatementImportPage() {
  const categoryTree = await listCategoryTree();
  const expenseCategories = categoryTree.filter((c) => !c.isIncome);

  return (
    <div className="flex flex-col gap-6">
      <StatementImportFlow categories={expenseCategories} />
    </div>
  );
}
