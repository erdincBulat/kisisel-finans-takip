"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/format-date";

function shiftMonth(year: number, month: number, delta: number) {
  const total = year * 12 + (month - 1) + delta;
  return { year: Math.floor(total / 12), month: (total % 12) + 1 };
}

export function MonthNav({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(y: number, m: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", `${y}-${String(m).padStart(2, "0")}`);
    router.push(`${pathname}?${params.toString()}`);
  }

  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(prev.year, prev.month)}>
        <ChevronLeft className="size-4" />
        <span className="sr-only">Önceki ay</span>
      </Button>
      <span className="min-w-32 text-center text-sm font-medium">{formatMonthYear(year, month)}</span>
      <Button variant="outline" size="icon" onClick={() => go(next.year, next.month)}>
        <ChevronRight className="size-4" />
        <span className="sr-only">Sonraki ay</span>
      </Button>
    </div>
  );
}
