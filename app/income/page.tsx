import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listIncomes } from "@/lib/db/income.service";
import { listCategoryTree } from "@/lib/db/category.service";
import { listAccountStatements } from "@/lib/db/account-statement.service";
import { IncomeTable } from "@/components/income/income-table";
import { IncomeFormDialog } from "@/components/income/income-form-dialog";
import { AccountStatementUploadCard } from "@/components/income/account-statement-upload-card";
import { AccountStatementsTable } from "@/components/income/account-statements-table";

export default async function IncomePage() {
  const [incomes, categoryTree, accountStatements] = await Promise.all([
    listIncomes(),
    listCategoryTree(),
    listAccountStatements(),
  ]);
  const incomeCategories = categoryTree.filter((c) => c.isIncome);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Gelirler</h1>
            <p className="text-sm text-muted-foreground">Manuel gelir kayıtları (maaş, freelance, diğer).</p>
          </div>
          <IncomeFormDialog
            title="Yeni gelir"
            categories={incomeCategories}
            trigger={
              <Button>
                <Plus className="size-4" /> Yeni Gelir
              </Button>
            }
          />
        </div>

        <IncomeTable incomes={incomes} categories={incomeCategories} />
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold">Hesap Özeti İçe Aktarma</h2>
          <p className="text-sm text-muted-foreground">
            Enpara vadesiz TL hesap özetinizi yükleyin; yalnızca gelen transferler (gelir) yukarıdaki listeye
            eklenir. Hesaptan çıkan hareketler (EFT, harcama, ATM vb.) işlemlere veya dashboard&apos;a hiç yansımaz.
          </p>
        </div>
        <AccountStatementUploadCard />
        <AccountStatementsTable statements={accountStatements} />
      </div>
    </div>
  );
}
