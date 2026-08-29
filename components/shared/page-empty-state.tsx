import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Sayfa seviyesinde "henüz veri yok, şunu yap" karşılama ekranı — Dashboard/Reports/History ortak. */
export function PageEmptyState({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button render={<Link href={ctaHref} />}>
        <Icon className="size-4" /> {ctaLabel}
      </Button>
    </div>
  );
}
