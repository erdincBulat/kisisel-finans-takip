"use client";

import { useActionState, useRef, useState, type ReactElement } from "react";
import type { Category, TransactionType } from "@prisma/client";
import { toast } from "sonner";
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
import {
  applyCategoryToMerchantAction,
  createMerchantRuleAction,
  createTransactionAction,
  updateTransactionAction,
} from "@/app/transactions/actions";

type CategoryWithChildren = Category & { children: Category[] };

const TYPE_ITEMS: Record<string, string> = { EXPENSE: "Harcama", REFUND: "İade" };

function toItems(categories: Category[]): Record<string, string> {
  return Object.fromEntries(categories.map((c) => [c.id, c.name]));
}

export type TransactionDefaultValues = {
  id: string;
  date: string; // yyyy-mm-dd
  description: string;
  normalizedMerchant: string;
  amountTL: string; // "1250,50"
  type: TransactionType;
  categoryId: string | null;
  subCategoryId: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
  notes: string | null;
};

type TransactionFormDialogProps = {
  trigger: ReactElement;
  title: string;
  categories: CategoryWithChildren[];
  transaction?: TransactionDefaultValues;
};

export function TransactionFormDialog({
  trigger,
  title,
  categories,
  transaction,
}: TransactionFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? "EXPENSE");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState(transaction?.subCategoryId ?? "");
  const isEdit = Boolean(transaction);

  // Dialog açıldığı andaki transaction'ın anlık görüntüsü. `transaction` prop'u
  // güvenilir bir "değişmedi önce" referansı DEĞİL: updateTransactionAction
  // içindeki revalidatePath("/transactions"), bu dialog hâlâ açıkken üst
  // Server Component'i (TransactionsTable) yeni kategoriyle yeniden render
  // edip prop'u GÜNCELLEYEBİLİYOR — başarı callback'i çalıştığında `transaction`
  // artık ESKİ değil YENİ kategoriyi taşıyabiliyor. Bu yüzden "değişti mi?"
  // karşılaştırması bu ref'e karşı yapılmalı, doğrudan prop'a karşı değil.
  const openedWithRef = useRef(transaction);

  const action = isEdit
    ? updateTransactionAction.bind(null, transaction!.id)
    : createTransactionAction;
  const [state, formAction, pending] = useActionState(action, initialActionState);

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const subCategories = selectedCategory?.children ?? [];
  const categoryItems = toItems(categories);
  const subCategoryItems = toItems(subCategories);

  useActionToast(state, () => {
    setOpen(false);
    const original = openedWithRef.current;
    if (!isEdit || !original || !categoryId) return;

    const categoryChanged = categoryId !== (original.categoryId ?? "");
    if (!categoryChanged) return;

    promptApplyToMerchant({
      normalizedMerchant: original.normalizedMerchant,
      excludeTransactionId: original.id,
      categoryId,
      subCategoryId: subCategoryId || null,
      categoryLabel: categories.find((c) => c.id === categoryId)?.name ?? "",
      subCategoryLabel: subCategories.find((c) => c.id === subCategoryId)?.name,
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          openedWithRef.current = transaction;
          setType(transaction?.type ?? "EXPENSE");
          setCategoryId(transaction?.categoryId ?? "");
          setSubCategoryId(transaction?.subCategoryId ?? "");
        }
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
              <Input id="date" name="date" type="date" defaultValue={transaction?.date} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Tutar (TL)</Label>
              <Input
                id="amount"
                name="amount"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={transaction?.amountTL}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="description">Açıklama</Label>
            <Input
              id="description"
              name="description"
              defaultValue={transaction?.description}
              required
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Tür</Label>
              <Select
                name="type"
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType((v as TransactionType) ?? "EXPENSE")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Harcama</SelectItem>
                  <SelectItem value="REFUND">İade</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
          </div>

          {subCategories.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <Label>Alt Kategori</Label>
              <Select
                name="subCategoryId"
                items={subCategoryItems}
                value={subCategoryId}
                onValueChange={(v) => setSubCategoryId(v ?? "")}
              >
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

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installmentCurrent">Taksit No (opsiyonel)</Label>
              <Input
                id="installmentCurrent"
                name="installmentCurrent"
                type="number"
                min={1}
                defaultValue={transaction?.installmentCurrent ?? undefined}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="installmentTotal">Toplam Taksit</Label>
              <Input
                id="installmentTotal"
                name="installmentTotal"
                type="number"
                min={1}
                defaultValue={transaction?.installmentTotal ?? undefined}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="notes">Not (opsiyonel)</Label>
            <Textarea id="notes" name="notes" defaultValue={transaction?.notes ?? undefined} rows={2} />
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

/**
 * Kategori değişikliğinden sonra tek bir soru (spec §11/§35 + kullanıcı
 * isteği): "Evet" denirse HEM gelecekteki içe aktarmalar için bir
 * MerchantRule oluşturulur HEM DE aynı merchant'a sahip mevcut tüm işlemler
 * (az önce düzenlenen hariç) anında bu kategoriye güncellenir. Düzenleme
 * dialog'unu bloklamaz.
 */
function promptApplyToMerchant(input: {
  normalizedMerchant: string;
  excludeTransactionId: string;
  categoryId: string;
  subCategoryId: string | null;
  categoryLabel: string;
  subCategoryLabel: string | undefined;
}) {
  const categoryLabel = input.subCategoryLabel ? `${input.categoryLabel} / ${input.subCategoryLabel}` : input.categoryLabel;

  toast(`"${input.normalizedMerchant}" adına sahip diğer tüm işlemleri de "${categoryLabel}" kategorisine atayalım mı?`, {
    duration: 10000,
    cancel: { label: "Hayır", onClick: () => {} },
    action: {
      label: "Evet, uygula",
      onClick: () => {
        void Promise.all([
          createMerchantRuleAction({
            normalizedMerchant: input.normalizedMerchant,
            categoryId: input.categoryId,
            subCategoryId: input.subCategoryId,
          }),
          applyCategoryToMerchantAction({
            normalizedMerchant: input.normalizedMerchant,
            categoryId: input.categoryId,
            subCategoryId: input.subCategoryId,
            excludeTransactionId: input.excludeTransactionId,
          }),
        ]).then(([, applyResult]) => {
          if (applyResult.status === "success") toast.success(applyResult.message ?? "Güncellendi.");
          else toast.error(applyResult.message ?? "Güncellenemedi.");
        });
      },
    },
  });
}
