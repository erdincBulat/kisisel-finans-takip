"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { createBudget, updateBudget, deleteBudget, BudgetDuplicateError } from "@/lib/db/budget.service";
import { budgetFormSchema } from "@/lib/validation/budget.schema";

export async function createBudgetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = budgetFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  try {
    await createBudget(parsed.data);
  } catch (error) {
    if (error instanceof BudgetDuplicateError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Bütçe eklenemedi." };
  }

  revalidatePath("/budgets");
  return { status: "success", message: "Bütçe eklendi." };
}

export async function updateBudgetAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = budgetFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Geçersiz form" };
  }

  try {
    await updateBudget(id, parsed.data);
  } catch (error) {
    if (error instanceof BudgetDuplicateError) {
      return { status: "error", message: error.message };
    }
    return { status: "error", message: "Bütçe güncellenemedi." };
  }

  revalidatePath("/budgets");
  return { status: "success", message: "Bütçe güncellendi." };
}

export async function deleteBudgetAction(id: string): Promise<ActionState> {
  try {
    await deleteBudget(id);
  } catch {
    return { status: "error", message: "Bütçe silinemedi." };
  }

  revalidatePath("/budgets");
  return { status: "success", message: "Bütçe silindi." };
}
