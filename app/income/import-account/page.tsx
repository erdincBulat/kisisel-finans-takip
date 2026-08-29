import { listCategoryTree } from "@/lib/db/category.service";
import { AccountStatementImportFlow } from "@/components/income/account-statement-import-flow";

export default async function AccountStatementImportPage() {
  const categoryTree = await listCategoryTree();
  const incomeCategories = categoryTree.filter((c) => c.isIncome);

  return (
    <div className="flex flex-col gap-6">
      <AccountStatementImportFlow incomeCategories={incomeCategories} />
    </div>
  );
}
