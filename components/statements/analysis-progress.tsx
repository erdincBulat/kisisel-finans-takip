import { CheckCircle2, Circle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Analiz aşamaları — spec §14/§66 ile birebir. */
export const ANALYSIS_STAGES = [
  "PDF okunuyor",
  "Ekstre dönemi belirleniyor",
  "İşlemler çıkarılıyor",
  "İşlemler kategorize ediliyor",
  "Taksitler analiz ediliyor",
  "Sonuçlar hazırlanıyor",
] as const;

/**
 * Aşama tabanlı, animasyonlu ilerleme göstergesi. Gerçek işlem süreleri
 * bilinmediği için sahte kesin yüzde yerine ✓/●/○ tarzı aşama göstergesi
 * kullanılır (spec §14).
 */
export function AnalysisProgress({ currentStage }: { currentStage: number }) {
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-8">
      <div>
        <h2 className="text-lg font-medium">Ekstre analiz ediliyor...</h2>
        <p className="text-sm text-muted-foreground">Bu birkaç saniye sürebilir.</p>
      </div>
      <ul className="flex flex-col gap-3">
        {ANALYSIS_STAGES.map((stage, i) => {
          const state = i < currentStage ? "done" : i === currentStage ? "active" : "pending";
          return (
            <li key={stage} className="flex items-center gap-2.5 text-sm">
              {state === "done" && <CheckCircle2 className="size-4 shrink-0 text-success" />}
              {state === "active" && <Loader2 className="size-4 shrink-0 animate-spin text-primary" />}
              {state === "pending" && <Circle className="size-4 shrink-0 text-muted-foreground" />}
              <span
                className={cn(
                  state === "pending" && "text-muted-foreground",
                  state === "active" && "font-medium",
                )}
              >
                {stage}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
