import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

/** İlk kullanım deneyimi (spec §69) — hiç Statement yoksa gösterilir. */
export function DashboardEmptyState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-24 text-center">
      <UploadCloud className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Finans takip sistemine hoş geldin.</h1>
        <p className="text-sm text-muted-foreground">
          Henüz hiçbir ekstre yüklenmemiş. İlk Enpara ekstresini yükleyerek başlayabilirsin.
        </p>
      </div>
      <Button render={<Link href="/statements" />}>
        <UploadCloud className="size-4" /> Ekstre Yükle
      </Button>
    </div>
  );
}
