import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listTransactions } from "@/lib/db/transaction.service";
import { listCategoryTree } from "@/lib/db/category.service";
import { listActiveConfirmedSubscriptionMerchants } from "@/lib/subscriptions/subscription.service";
import { TransactionsFilters } from "@/components/transactions/transactions-filters";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionFormDialog } from "@/components/transactions/transaction-form-dialog";

export default async function TransactionsPage(props: PageProps<"/transactions">) {
  const searchParams = await props.searchParams;
  const monthParam = typeof searchParams.month === "string" ? searchParams.month : undefined;
  const [year, month] = monthParam ? monthParam.split("-").map(Number) : [undefined, undefined];

  const [transactions, categoryTree, subscribedMerchants] = await Promise.all([
    listTransactions({
      year,
      month,
      categoryId: typeof searchParams.categoryId === "string" ? searchParams.categoryId : undefined,
      type:
        searchParams.type === "EXPENSE" || searchParams.type === "REFUND"
          ? searchParams.type
          : undefined,
      onlyInstallments: searchParams.onlyInstallments === "1",
      search: typeof searchParams.q === "string" ? searchParams.q : undefined,
    }),
    listCategoryTree(),
    listActiveConfirmedSubscriptionMerchants(),
  ]);

  const expenseCategories = categoryTree.filter((c) => !c.isIncome);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">İşlemler</h1>
          <p className="text-sm text-muted-foreground">
            Tüm harcama ve iade işlemleri. PDF ekstre içe aktarmak için Ekstreler sayfasını kullanın.
          </p>
        </div>
        <TransactionFormDialog
          title="Yeni işlem"
          categories={expenseCategories}
          trigger={
            <Button>
              <Plus className="size-4" /> Yeni İşlem
            </Button>
          }
        />
      </div>

      <TransactionsFilters categories={expenseCategories} />
      <TransactionsTable
        transactions={transactions}
        categories={expenseCategories}
        subscribedMerchants={subscribedMerchants}
      />
    </div>
  );
}
