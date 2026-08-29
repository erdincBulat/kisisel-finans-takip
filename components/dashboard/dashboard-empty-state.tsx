import { UploadCloud } from "lucide-react";
import { PageEmptyState } from "@/components/shared/page-empty-state";

/** İlk kullanım deneyimi (spec §69) — hiç Statement yoksa gösterilir. */
export function DashboardEmptyState() {
  return (
    <PageEmptyState
      icon={UploadCloud}
      title="Finans takip sistemine hoş geldin."
      description="Henüz hiçbir ekstre yüklenmemiş. İlk Enpara ekstresini yükleyerek başlayabilirsin."
      ctaHref="/statements"
      ctaLabel="Ekstre Yükle"
    />
  );
}
