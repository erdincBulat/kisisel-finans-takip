"use client";

import type { Category } from "@prisma/client";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryDialog } from "./category-dialog";
import { CategoryDeleteButton } from "./category-delete-button";

type CategoryWithChildren = Category & { children: Category[] };

function ColorDot({ color }: { color: string }) {
  return <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

function CategoryRow({
  category,
  moveCandidates,
  isChild = false,
}: {
  category: Category;
  moveCandidates: Category[];
  isChild?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-accent/50 ${isChild ? "ml-6" : ""}`}>
      <div className="flex min-w-0 items-center gap-2">
        <ColorDot color={category.color} />
        <span className="truncate text-sm">{category.name}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <CategoryDialog
          title={`"${category.name}" düzenle`}
          category={category}
          trigger={
            <Button variant="ghost" size="icon-sm">
              <Pencil className="size-3.5" />
              <span className="sr-only">Düzenle</span>
            </Button>
          }
        />
        <CategoryDeleteButton
          category={category}
          moveCandidates={moveCandidates}
          trigger={
            <Button variant="ghost" size="icon-sm">
              <Trash2 className="size-3.5" />
              <span className="sr-only">Sil</span>
            </Button>
          }
        />
      </div>
    </div>
  );
}

function CategoryGroup({
  category,
  mainMoveCandidates,
  allCategories,
}: {
  category: CategoryWithChildren;
  mainMoveCandidates: Category[];
  allCategories: CategoryWithChildren[];
}) {
  const subMoveCandidates = allCategories
    .filter((c) => c.isIncome === category.isIncome)
    .flatMap((c) => c.children);

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <div className="flex items-center gap-2">
          <ColorDot color={category.color} />
          <span className="text-sm font-semibold">{category.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <CategoryDialog
            title={`"${category.name}" içine alt kategori ekle`}
            parent={{ id: category.id, isIncome: category.isIncome }}
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Plus className="size-3.5" />
                <span className="sr-only">Alt kategori ekle</span>
              </Button>
            }
          />
          <CategoryDialog
            title={`"${category.name}" düzenle`}
            category={category}
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Pencil className="size-3.5" />
                <span className="sr-only">Düzenle</span>
              </Button>
            }
          />
          <CategoryDeleteButton
            category={category}
            moveCandidates={mainMoveCandidates.filter((c) => c.id !== category.id)}
            trigger={
              <Button variant="ghost" size="icon-sm">
                <Trash2 className="size-3.5" />
                <span className="sr-only">Sil</span>
              </Button>
            }
          />
        </div>
      </div>
      <div className="mt-1 flex flex-col">
        {category.children.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            isChild
            moveCandidates={subMoveCandidates.filter((c) => c.id !== child.id)}
          />
        ))}
      </div>
    </div>
  );
}

export function CategoryTreeView({ categories }: { categories: CategoryWithChildren[] }) {
  const expenseCategories = categories.filter((c) => !c.isIncome);
  const incomeCategories = categories.filter((c) => c.isIncome);

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Gider Kategorileri</h2>
          <CategoryDialog
            title="Yeni ana kategori"
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="size-3.5" /> Ana Kategori
              </Button>
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {expenseCategories.map((category) => (
            <CategoryGroup
              key={category.id}
              category={category}
              mainMoveCandidates={expenseCategories}
              allCategories={categories}
            />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-muted-foreground">Gelir Kategorileri</h2>
          <CategoryDialog
            title="Yeni gelir kategorisi"
            defaultIsIncome
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="size-3.5" /> Gelir Kategorisi
              </Button>
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {incomeCategories.map((category) => (
            <CategoryGroup
              key={category.id}
              category={category}
              mainMoveCandidates={incomeCategories}
              allCategories={categories}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
