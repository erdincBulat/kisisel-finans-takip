"use client";

import { useActionState, useState, type ReactElement } from "react";
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
import { useActionToast } from "@/components/shared/use-action-toast";
import { initialActionState } from "@/lib/action-state";
import { createCategoryAction, updateCategoryAction } from "@/app/categories/actions";

type CategoryDialogProps = {
  trigger: ReactElement;
  title: string;
  /** Düzenlenen kategori (edit modu) */
  category?: { id: string; name: string; color: string; isIncome: boolean; parentId: string | null };
  /** Yeni alt kategori oluşturulacaksa üst kategori bilgisi */
  parent?: { id: string; isIncome: boolean };
  /** Yeni ana kategori oluştururken (parent yokken) gelir mi gider mi olacağı */
  defaultIsIncome?: boolean;
};

export function CategoryDialog({
  trigger,
  title,
  category,
  parent,
  defaultIsIncome = false,
}: CategoryDialogProps) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(category);
  const parentId = category?.parentId ?? parent?.id ?? null;
  const isIncome = category?.isIncome ?? parent?.isIncome ?? defaultIsIncome;
  const isSubCategory = parentId !== null;

  const action = isEdit ? updateCategoryAction.bind(null, category!.id) : createCategoryAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useActionToast(state, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {isSubCategory && <input type="hidden" name="parentId" value={parentId} />}
          <input type="hidden" name="isIncome" value={isIncome ? "on" : "off"} />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Ad</Label>
            <Input id="name" name="name" defaultValue={category?.name} required maxLength={60} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="color">Renk</Label>
            <input
              id="color"
              name="color"
              type="color"
              defaultValue={category?.color ?? "#64748b"}
              className="h-9 w-16 rounded-md border border-input bg-transparent p-1"
            />
          </div>

          {!isSubCategory && (
            <p className="text-xs text-muted-foreground">
              {isIncome ? "Bu bir gelir kategorisidir." : "Bu bir gider kategorisidir."}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Kaydediliyor..." : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
