"use client";

import { useTransition, type ComponentProps } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";

type SubscriptionActionButtonProps = {
  label: string;
  pendingLabel: string;
  variant?: ComponentProps<typeof Button>["variant"];
  action: () => Promise<ActionState>;
};

export function SubscriptionActionButton({ label, pendingLabel, variant = "outline", action }: SubscriptionActionButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await action();
      if (result.status === "success") {
        toast.success(result.message ?? "İşlem tamamlandı.");
      } else {
        toast.error(result.message ?? "İşlem başarısız.");
      }
    });
  }

  return (
    <Button size="sm" variant={variant} onClick={handleClick} disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}
