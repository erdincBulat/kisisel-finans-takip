"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  moveCategoryTransactionsAndDelete,
  CategoryInUseError,
  type CategoryInUseReason,
} from "@/lib/db/category.service";
import { categoryFormSchema } from "@/lib/validation/category.schema";

export async function createCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categoryFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  try {
    await createCategory(parsed.data);
  } catch {
    return { status: "error", message: "Kategori eklenemedi." };
  }

  revalidatePath("/categories");
  return { status: "success", message: `"${parsed.data.name}" kategorisi eklendi.` };
}

export async function updateCategoryAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categoryFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  try {
    await updateCategory(id, parsed.data);
  } catch {
    return { status: "error", message: "Kategori güncellenemedi." };
  }

  revalidatePath("/categories");
  return { status: "success", message: "Kategori güncellendi." };
}

export type DeleteCategoryResult = ActionState & { reason?: CategoryInUseReason };

export async function deleteCategoryAction(id: string): Promise<DeleteCategoryResult> {
  try {
    await deleteCategory(id);
  } catch (error) {
    if (error instanceof CategoryInUseError) {
      return { status: "error", message: error.message, reason: error.reason };
    }
    return { status: "error", message: "Kategori silinemedi." };
  }

  revalidatePath("/categories");
  return { status: "success", message: "Kategori silindi." };
}

/**
 * Silinemeyen (işlem içeren) bir kategoriyi başka bir kategoriye "taşı ve
 * sil" — kategori yönetimini kolaylaştırma isteği üzerine eklendi.
 */
export async function moveCategoryTransactionsAndDeleteAction(fromId: string, toId: string): Promise<ActionState> {
  try {
    const movedCount = await moveCategoryTransactionsAndDelete(fromId, toId);
    revalidatePath("/categories");
    revalidatePath("/transactions");
    return {
      status: "success",
      message: movedCount > 0 ? `${movedCount} işlem taşındı, kategori silindi.` : "Kategori silindi.",
    };
  } catch (error) {
    if (error instanceof CategoryInUseError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Taşıma işlemi başarısız oldu." };
  }
}
