"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  bulkUpdateCategory,
  updateCategoryByMerchant,
} from "@/lib/db/transaction.service";
import { transactionFormSchema } from "@/lib/validation/transaction.schema";
import { normalizeMerchant } from "@/lib/merchants/normalize";
import { upsertMerchantRule } from "@/lib/merchants/merchant-rule.service";

export async function createTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transactionFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }
  const data = parsed.data;

  try {
    await createTransaction({
      date: new Date(data.date),
      description: data.description,
      normalizedMerchant: normalizeMerchant(data.description),
      amount: data.amount,
      type: data.type,
      source: "MANUAL",
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      installmentCurrent: data.installmentCurrent,
      installmentTotal: data.installmentTotal,
      notes: data.notes,
    });
  } catch {
    return { status: "error", message: "İşlem eklenemedi." };
  }

  revalidatePath("/transactions");
  return { status: "success", message: "İşlem eklendi." };
}

export async function updateTransactionAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = transactionFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }
  const data = parsed.data;

  try {
    await updateTransaction(id, {
      date: new Date(data.date),
      description: data.description,
      normalizedMerchant: normalizeMerchant(data.description),
      amount: data.amount,
      type: data.type,
      categoryId: data.categoryId,
      subCategoryId: data.subCategoryId,
      installmentCurrent: data.installmentCurrent,
      installmentTotal: data.installmentTotal,
      notes: data.notes,
    });
  } catch {
    return { status: "error", message: "İşlem güncellenemedi." };
  }

  revalidatePath("/transactions");
  return { status: "success", message: "İşlem güncellendi." };
}

export async function deleteTransactionAction(id: string): Promise<ActionState> {
  try {
    await deleteTransaction(id);
  } catch {
    return { status: "error", message: "İşlem silinemedi." };
  }

  revalidatePath("/transactions");
  return { status: "success", message: "İşlem silindi." };
}

/** Toplu kategori ataması — /transactions'ta seçilen birden fazla işleme aynı anda kategori atar. */
export async function bulkUpdateCategoryAction(
  ids: string[],
  categoryId: string,
  subCategoryId: string | null,
): Promise<ActionState> {
  if (ids.length === 0) {
    return { status: "error", message: "Önce en az bir işlem seçmelisiniz." };
  }
  if (!categoryId) {
    return { status: "error", message: "Bir kategori seçmelisiniz." };
  }

  try {
    await bulkUpdateCategory(ids, categoryId, subCategoryId);
  } catch {
    return { status: "error", message: "Kategori atanamadı." };
  }

  revalidatePath("/transactions");
  return { status: "success", message: `${ids.length} işlem güncellendi.` };
}

export type ApplyCategoryToMerchantInput = {
  normalizedMerchant: string;
  categoryId: string;
  subCategoryId: string | null;
  excludeTransactionId?: string;
};

/**
 * Bir işlemin kategorisi değiştirildiğinde, aynı merchant'a sahip TÜM MEVCUT
 * işlemlere de anında uygulama akışı — `createMerchantRuleAction`'ın
 * (yalnızca gelecekteki içe aktarmaları etkiler) tamamlayıcısı.
 */
export async function applyCategoryToMerchantAction(input: ApplyCategoryToMerchantInput): Promise<ActionState> {
  let updatedCount = 0;
  try {
    const result = await updateCategoryByMerchant(
      input.normalizedMerchant,
      input.categoryId,
      input.subCategoryId,
      input.excludeTransactionId,
    );
    updatedCount = result.count;
  } catch {
    return { status: "error", message: "İşlemler güncellenemedi." };
  }

  revalidatePath("/transactions");
  return {
    status: "success",
    message:
      updatedCount > 0
        ? `"${input.normalizedMerchant}" adına sahip ${updatedCount} işlem daha güncellendi.`
        : `"${input.normalizedMerchant}" adına sahip başka işlem bulunamadı.`,
  };
}

export type CreateMerchantRuleInput = {
  normalizedMerchant: string;
  categoryId: string;
  subCategoryId: string | null;
};

/**
 * "Gelecekte de uygula?" akışı (spec §11/§35): kullanıcı bir işlemin
 * kategorisini değiştirdikten sonra bu merchant için kalıcı bir kural
 * oluşturur. `merchantPattern` doğrudan bu işlemin normalizedMerchant'ından
 * türetilir — gelecekteki eşleşme `lib/categorization/engine.ts`'in aynı
 * (case-insensitive, Türkçe locale) alt dize karşılaştırmasını kullanır.
 */
export async function createMerchantRuleAction(input: CreateMerchantRuleInput): Promise<ActionState> {
  try {
    await upsertMerchantRule({
      merchantPattern: input.normalizedMerchant,
      normalizedMerchant: input.normalizedMerchant,
      categoryId: input.categoryId,
      subCategoryId: input.subCategoryId,
    });
  } catch {
    return { status: "error", message: "Kural oluşturulamadı." };
  }

  return {
    status: "success",
    message: `Gelecekte "${input.normalizedMerchant}" işlemleri otomatik olarak bu kategoriye atanacak.`,
  };
}
