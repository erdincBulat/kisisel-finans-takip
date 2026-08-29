"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { updateMerchantRule, deleteMerchantRule } from "@/lib/merchants/merchant-rule.service";

export async function updateMerchantRuleAction(
  id: string,
  categoryId: string,
  subCategoryId: string | null,
): Promise<ActionState> {
  if (!categoryId) {
    return { status: "error", message: "Bir kategori seçmelisiniz." };
  }

  try {
    await updateMerchantRule(id, { categoryId, subCategoryId });
  } catch {
    return { status: "error", message: "Kural güncellenemedi." };
  }

  revalidatePath("/settings/merchant-rules");
  return { status: "success", message: "Kural güncellendi." };
}

export async function deleteMerchantRuleAction(id: string): Promise<ActionState> {
  try {
    await deleteMerchantRule(id);
  } catch {
    return { status: "error", message: "Kural silinemedi." };
  }

  revalidatePath("/settings/merchant-rules");
  return { status: "success", message: "Kural silindi." };
}
