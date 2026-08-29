"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function YearNav({ year }: { year: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function go(y: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("year", String(y));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(year - 1)}>
        <ChevronLeft className="size-4" />
        <span className="sr-only">Önceki yıl</span>
      </Button>
      <span className="min-w-16 text-center text-sm font-medium">{year}</span>
      <Button variant="outline" size="icon" onClick={() => go(year + 1)}>
        <ChevronRight className="size-4" />
        <span className="sr-only">Sonraki yıl</span>
      </Button>
    </div>
  );
}
