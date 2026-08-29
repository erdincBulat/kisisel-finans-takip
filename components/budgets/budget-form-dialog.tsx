"use client";

import { useActionState, useState, type ReactElement } from "react";
import type { Category } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActionToast } from "@/components/shared/use-action-toast";
import { initialActionState } from "@/lib/action-state";
import { createBudgetAction, updateBudgetAction } from "@/app/budgets/actions";

type CategoryWithChildren = Category & { children: Category[] };

function toItems(categories: Category[]): Record<string, string> {
  return Object.fromEntries(categories.map((c) => [c.id, c.name]));
}

export type BudgetDefaultValues = {
  id: string;
  categoryId: string;
  subCategoryId: string | null;
  limitAmountTL: string; // "1250,50"
};

type BudgetFormDialogProps = {
  trigger: ReactElement;
  title: string;
  categories: CategoryWithChildren[];
  budget?: BudgetDefaultValues;
};

export function BudgetFormDialog({ trigger, title, categories, budget }: BudgetFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState(budget?.subCategoryId ?? "");
  const isEdit = Boolean(budget);

  const action = isEdit ? updateBudgetAction.bind(null, budget!.id) : createBudgetAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCategory?.children ?? [];
  const categoryItems = toItems(categories);
  const subCategoryItems = toItems(subCategories);

  useActionToast(state, () => setOpen(false));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setCategoryId(budget?.categoryId ?? "");
          setSubCategoryId(budget?.subCategoryId ?? "");
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Kategori</Label>
            <Select
              name="categoryId"
              items={categoryItems}
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v ?? "");
                setSubCategoryId("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seçin" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {subCategories.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Alt Kategori (opsiyonel)</Label>
              <Select
                name="subCategoryId"
                items={subCategoryItems}
                value={subCategoryId}
                onValueChange={(v) => setSubCategoryId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tüm kategori (alt kategori seçilmedi)" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Boş bırakılırsa bütçe kategorinin tüm harcamasını (alt kategoriler dahil) kapsar.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="limitAmount">Aylık Limit (TL)</Label>
            <Input
              id="limitAmount"
              name="limitAmount"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={budget?.limitAmountTL}
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending || !categoryId}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
