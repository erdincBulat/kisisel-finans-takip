"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import type { ActionState } from "@/lib/action-state";

/** Server action sonucu değiştiğinde uygun toast'ı gösterir (spec §65). */
export function useActionToast(state: ActionState, onSuccess?: () => void) {
  const lastHandled = useRef<ActionState | null>(null);

  useEffect(() => {
    if (state === lastHandled.current || state.status === "idle") return;
    lastHandled.current = state;

    if (state.status === "success") {
      toast.success(state.message ?? "İşlem tamamlandı.");
      onSuccess?.();
    } else if (state.status === "error") {
      toast.error(state.message ?? "Bir hata oluştu.");
    }
  }, [state, onSuccess]);
}
