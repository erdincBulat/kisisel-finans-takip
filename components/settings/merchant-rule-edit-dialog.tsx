"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import type { Category, MerchantRule } from "@prisma/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateMerchantRuleAction } from "@/app/settings/merchant-rules/actions";

type CategoryWithChildren = Category & { children: Category[] };

function toItems(categories: Category[]): Record<string, string> {
  return Object.fromEntries(categories.map((c) => [c.id, c.name]));
}

export function MerchantRuleEditDialog({
  rule,
  categories,
  trigger,
}: {
  rule: MerchantRule;
  categories: CategoryWithChildren[];
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(rule.categoryId);
  const [subCategoryId, setSubCategoryId] = useState(rule.subCategoryId ?? "");
  const [pending, startTransition] = useTransition();

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCategory?.children ?? [];

  function handleSave() {
    startTransition(async () => {
      const result = await updateMerchantRuleAction(rule.id, categoryId, subCategoryId || null);
      if (result.status === "success") {
        toast.success(result.message ?? "Kural güncellendi.");
        setOpen(false);
      } else {
        toast.error(result.message ?? "Kural güncellenemedi.");
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setCategoryId(rule.categoryId);
          setSubCategoryId(rule.subCategoryId ?? "");
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{`"${rule.normalizedMerchant}" kuralını düzenle`}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label>Kategori</Label>
            <Select
              items={toItems(categories)}
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
              <Label>Alt Kategori</Label>
              <Select items={toItems(subCategories)} value={subCategoryId} onValueChange={(v) => setSubCategoryId(v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seçin (opsiyonel)" />
                </SelectTrigger>
                <SelectContent>
                  {subCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!categoryId || pending}>
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
