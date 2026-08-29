"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type { Category } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

export function TransactionsFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const hasFilters = searchParams.size > 0;

  const categoryItems: Record<string, string> = {
    all: "Tüm kategoriler",
    ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
  };
  const typeItems: Record<string, string> = { all: "Tüm türler", EXPENSE: "Harcama", REFUND: "İade" };
  const sourceItems: Record<string, string> = { all: "Tüm kaynaklar", MANUAL: "Manuel", STATEMENT: "Ekstre" };
  const installmentItems: Record<string, string> = { all: "Tüm işlemler", yes: "Yalnızca taksitli" };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="month"
        className="w-40"
        defaultValue={searchParams.get("month") ?? ""}
        onChange={(e) => updateParam("month", e.target.value || null)}
      />

      <Select
        items={categoryItems}
        value={searchParams.get("categoryId") ?? "all"}
        onValueChange={(v) => updateParam("categoryId", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Kategori" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm kategoriler</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={typeItems}
        value={searchParams.get("type") ?? "all"}
        onValueChange={(v) => updateParam("type", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-32">
          <SelectValue placeholder="Tür" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm türler</SelectItem>
          <SelectItem value="EXPENSE">Harcama</SelectItem>
          <SelectItem value="REFUND">İade</SelectItem>
        </SelectContent>
      </Select>

      <Select
        items={sourceItems}
        value={searchParams.get("source") ?? "all"}
        onValueChange={(v) => updateParam("source", v === "all" ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Kaynak" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm kaynaklar</SelectItem>
          <SelectItem value="MANUAL">Manuel</SelectItem>
          <SelectItem value="STATEMENT">Ekstre</SelectItem>
        </SelectContent>
      </Select>

      <Select
        items={installmentItems}
        value={searchParams.get("onlyInstallments") === "1" ? "yes" : "all"}
        onValueChange={(v) => updateParam("onlyInstallments", v === "yes" ? "1" : null)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Taksit" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tüm işlemler</SelectItem>
          <SelectItem value="yes">Yalnızca taksitli</SelectItem>
        </SelectContent>
      </Select>

      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("q", search || null);
        }}
      >
        <Input
          placeholder="Merchant veya açıklama ara..."
          className="w-56"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            router.push(pathname);
          }}
        >
          <X className="size-3.5" /> Temizle
        </Button>
      )}
    </div>
  );
}
