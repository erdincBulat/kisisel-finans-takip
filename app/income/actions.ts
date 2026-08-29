"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { createIncome, updateIncome, deleteIncome } from "@/lib/db/income.service";
import { incomeFormSchema } from "@/lib/validation/income.schema";

export async function createIncomeAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = incomeFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }
  const data = parsed.data;

  try {
    await createIncome({
      date: new Date(data.date),
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId,
      notes: data.notes,
    });
  } catch {
    return { status: "error", message: "Gelir eklenemedi." };
  }

  revalidatePath("/income");
  return { status: "success", message: "Gelir eklendi." };
}

export async function updateIncomeAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = incomeFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }
  const data = parsed.data;

  try {
    await updateIncome(id, {
      date: new Date(data.date),
      description: data.description,
      amount: data.amount,
      categoryId: data.categoryId,
      notes: data.notes,
    });
  } catch {
    return { status: "error", message: "Gelir güncellenemedi." };
  }

  revalidatePath("/income");
  return { status: "success", message: "Gelir güncellendi." };
}

export async function deleteIncomeAction(id: string): Promise<ActionState> {
  try {
    await deleteIncome(id);
  } catch {
    return { status: "error", message: "Gelir silinemedi." };
  }

  revalidatePath("/income");
  return { status: "success", message: "Gelir silindi." };
}
