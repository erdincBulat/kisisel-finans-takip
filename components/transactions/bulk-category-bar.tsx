"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bulkUpdateCategoryAction } from "@/app/transactions/actions";

type CategoryWithChildren = Category & { children: Category[] };

function toItems(categories: Category[]): Record<string, string> {
  return Object.fromEntries(categories.map((c) => [c.id, c.name]));
}

/** /transactions'ta çoklu seçim yapıldığında görünen toplu kategori atama araç çubuğu. */
export function BulkCategoryBar({
  selectedIds,
  categories,
  onDone,
}: {
  selectedIds: string[];
  categories: CategoryWithChildren[];
  onDone: () => void;
}) {
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [pending, startTransition] = useTransition();

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCategory?.children ?? [];

  function handleApply() {
    if (!categoryId) return;
    startTransition(async () => {
      const result = await bulkUpdateCategoryAction(selectedIds, categoryId, subCategoryId || null);
      if (result.status === "success") {
        toast.success(result.message ?? "Güncellendi.");
        setCategoryId("");
        setSubCategoryId("");
        onDone();
      } else {
        toast.error(result.message ?? "Güncellenemedi.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
      <span className="text-sm font-medium">{selectedIds.length} işlem seçili</span>

      <Select
        items={toItems(categories)}
        value={categoryId}
        onValueChange={(v) => {
          setCategoryId(v ?? "");
          setSubCategoryId("");
        }}
      >
        <SelectTrigger size="sm" className="w-40">
          <SelectValue placeholder="Kategori seçin" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {subCategories.length > 0 && (
        <Select items={toItems(subCategories)} value={subCategoryId} onValueChange={(v) => setSubCategoryId(v ?? "")}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Alt kategori (opsiyonel)" />
          </SelectTrigger>
          <SelectContent>
            {subCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button size="sm" onClick={handleApply} disabled={!categoryId || pending}>
        {pending ? "Uygulanıyor..." : "Uygula"}
      </Button>
      <Button variant="ghost" size="sm" onClick={onDone}>
        <X className="size-3.5" /> Vazgeç
      </Button>
    </div>
  );
}
