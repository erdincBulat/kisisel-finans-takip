"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteCategoryAction, moveCategoryTransactionsAndDeleteAction } from "@/app/categories/actions";

/**
 * Kategori silme: normal `ConfirmDeleteButton`'dan farklı olarak, silme
 * işlem sayısı yüzünden engellenirse (spec §9) kullanıcıya doğrudan burada
 * "işlemleri başka kategoriye taşı ve sil" seçeneğini sunar — ayrı ayrı
 * /transactions'a gidip tek tek düzenlemek yerine.
 */
export function CategoryDeleteButton({
  category,
  moveCandidates,
  trigger,
}: {
  category: Category;
  moveCandidates: Category[];
  trigger: ReactElement;
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"confirm" | "move">("confirm");
  const [targetId, setTargetId] = useState("");
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategoryAction(category.id);
      if (result.status === "success") {
        toast.success(result.message ?? "Silindi.");
        setOpen(false);
      } else if (result.reason === "TRANSACTIONS" && moveCandidates.length > 0) {
        setMode("move");
      } else {
        toast.error(result.message ?? "Silinemedi.");
        setOpen(false);
      }
    });
  }

  function handleMoveAndDelete() {
    if (!targetId) return;
    startTransition(async () => {
      const result = await moveCategoryTransactionsAndDeleteAction(category.id, targetId);
      setOpen(false);
      if (result.status === "success") toast.success(result.message ?? "Taşındı ve silindi.");
      else toast.error(result.message ?? "İşlem başarısız oldu.");
    });
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setMode("confirm");
          setTargetId("");
        }
      }}
    >
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        {mode === "confirm" ? (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Kategoriyi sil</AlertDialogTitle>
              <AlertDialogDescription>{`"${category.name}" kategorisini silmek istediğinize emin misiniz?`}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={pending}>
                {pending ? "Siliniyor..." : "Sil"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>İşlemleri taşı ve sil</AlertDialogTitle>
              <AlertDialogDescription>
                {`"${category.name}" kategorisinde işlem olduğu için doğrudan silinemiyor. Bu kategorideki tüm kayıtları seçeceğiniz kategoriye taşıyıp ardından silebilirsiniz.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Select
              items={Object.fromEntries(moveCandidates.map((c) => [c.id, c.name]))}
              value={targetId}
              onValueChange={(v) => setTargetId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Hedef kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {moveCandidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <AlertDialogFooter>
              <AlertDialogCancel>Vazgeç</AlertDialogCancel>
              <AlertDialogAction onClick={handleMoveAndDelete} disabled={pending || !targetId}>
                {pending ? "Taşınıyor..." : "Taşı ve Sil"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}
