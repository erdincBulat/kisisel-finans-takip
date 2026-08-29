import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listMerchantRules } from "@/lib/merchants/merchant-rule.service";
import { listCategoryTree } from "@/lib/db/category.service";
import { MerchantRulesTable } from "@/components/settings/merchant-rules-table";

export default async function MerchantRulesPage() {
  const [rules, categoryTree] = await Promise.all([listMerchantRules(), listCategoryTree()]);
  const expenseCategories = categoryTree.filter((c) => !c.isIncome);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Ayarlar
        </Link>
        <h1 className="text-2xl font-semibold">Merchant Kuralları</h1>
        <p className="text-sm text-muted-foreground">
          Bir merchant için oluşturulmuş otomatik kategorilendirme kuralları. Bu kurallar yalnızca
          gelecekte içe aktarılan/eklenen işlemlerin kategori önerisini etkiler.
        </p>
      </div>
      <MerchantRulesTable rules={rules} categories={expenseCategories} />
    </div>
  );
}
