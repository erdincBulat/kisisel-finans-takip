"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { confirmSubscription, setSubscriptionActive } from "@/lib/subscriptions/subscription.service";

export async function confirmSubscriptionAction(id: string): Promise<ActionState> {
  try {
    await confirmSubscription(id);
  } catch {
    return { status: "error", message: "Abonelik onaylanamadı." };
  }

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { status: "success", message: "Abonelik onaylandı." };
}

export async function setSubscriptionActiveAction(id: string, active: boolean): Promise<ActionState> {
  try {
    await setSubscriptionActive(id, active);
  } catch {
    return { status: "error", message: active ? "Abonelik aktif edilemedi." : "Abonelik pasif edilemedi." };
  }

  revalidatePath("/subscriptions");
  revalidatePath("/dashboard");
  return { status: "success", message: active ? "Abonelik aktif edildi." : "Abonelik pasif edildi." };
}
