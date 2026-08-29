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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActionToast } from "@/components/shared/use-action-toast";
import { initialActionState } from "@/lib/action-state";
import { createIncomeAction, updateIncomeAction } from "@/app/income/actions";

export type IncomeDefaultValues = {
  id: string;
  date: string;
  description: string;
  amountTL: string;
  categoryId: string | null;
  notes: string | null;
};

type IncomeFormDialogProps = {
  trigger: ReactElement;
  title: string;
  categories: Category[];
  income?: IncomeDefaultValues;
};

export function IncomeFormDialog({ trigger, title, categories, income }: IncomeFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState(income?.categoryId ?? "");
  const isEdit = Boolean(income);
  const categoryItems = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const action = isEdit ? updateIncomeAction.bind(null, income!.id) : createIncomeAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useActionToast(state, () => setOpen(false));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setCategoryId(income?.categoryId ?? "");
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">Tarih</Label>
              <Input id="date" name="date" type="date" defaultValue={income?.date} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Tutar (TL)</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={income?.amountTL}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Input
              id="description"
              name="description"
              defaultValue={income?.description}
              required
              maxLength={200}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Kategori</Label>
            <Select
              name="categoryId"
              items={categoryItems}
              value={categoryId}
              onValueChange={(v) => setCategoryId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seçin (opsiyonel)" />
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

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Not (opsiyonel)</Label>
            <Textarea id="notes" name="notes" defaultValue={income?.notes ?? undefined} rows={2} />
          </div>

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
