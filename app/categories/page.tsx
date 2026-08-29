import { listCategoryTree } from "@/lib/db/category.service";
import { CategoryTreeView } from "@/components/categories/category-tree-view";

export default async function CategoriesPage() {
  const categories = await listCategoryTree();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Kategoriler</h1>
        <p className="text-sm text-muted-foreground">
          Ana ve alt kategorileri yönetin. İşlem içeren kategoriler doğrudan silinemez.
        </p>
      </div>
      <CategoryTreeView categories={categories} />
    </div>
  );
}
