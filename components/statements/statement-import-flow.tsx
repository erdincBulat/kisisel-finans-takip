"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import { analyzeStatementAction, saveStatementImportAction } from "@/app/statements/actions";
import type { AnalyzeStatementSuccess } from "@/app/statements/actions";
import type { ParsedTransaction } from "@/lib/pdf/types";
import { takePendingStatementFile } from "@/lib/statement-import/pending-upload";
import { StatementDropzone } from "./statement-dropzone";
import { AnalysisProgress, ANALYSIS_STAGES } from "./analysis-progress";
import { StatementPreview } from "./statement-preview";

type CategoryWithChildren = Category & { children: Category[] };

export type EditableTransactionRow = ParsedTransaction & {
  categoryId: string | null;
  subCategoryId: string | null;
};

type UploadError = { title: string; description: string };
type Phase = "upload" | "analyzing" | "preview";

const STAGE_TICK_MS = 500;

/** `/statements/import` sayfasının tüm akışını yönetir: upload → analiz → önizleme → kaydet. */
export function StatementImportFlow({ categories }: { categories: CategoryWithChildren[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("upload");
  const [stageIndex, setStageIndex] = useState(0);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [analyzed, setAnalyzed] = useState<AnalyzeStatementSuccess | null>(null);
  const [rows, setRows] = useState<EditableTransactionRow[]>([]);
  const [saving, startSaveTransition] = useTransition();

  useEffect(() => {
    // Sadece mount'ta bekleyen dosyayı bir kez tüketmek için, bkz. pending-upload.ts.
    const file = takePendingStatementFile();
    if (file) void runAnalysis(file);
  }, []);

  async function runAnalysis(file: File) {
    setUploadError(null);
    setPhase("analyzing");
    setStageIndex(0);

    const formData = new FormData();
    formData.append("file", file);

    // Gerçek analiz tek bir server round-trip'te biter; gerçek süre bilinmediği
    // için (spec §14) aşamalar en az bu süre boyunca sırayla açılır, sonuç daha
    // erken gelse bile aniden bitmiş gibi görünmez.
    const tickTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, ANALYSIS_STAGES.length - 2));
    }, STAGE_TICK_MS);
    const minDelay = new Promise((resolve) => setTimeout(resolve, STAGE_TICK_MS * (ANALYSIS_STAGES.length - 1)));

    const [result] = await Promise.all([analyzeStatementAction(formData), minDelay]);
    clearInterval(tickTimer);
    setStageIndex(ANALYSIS_STAGES.length - 1);
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (result.status === "error") {
      setUploadError({ title: result.title, description: result.description });
      setPhase("upload");
      return;
    }

    setAnalyzed(result);
    setRows(
      result.transactions.map(({ suggestedCategoryId, suggestedSubCategoryId, ...t }) => ({
        ...t,
        categoryId: suggestedCategoryId,
        subCategoryId: suggestedSubCategoryId,
      })),
    );
    setPhase("preview");
  }

  function handleCategoryChange(index: number, categoryId: string | null, subCategoryId: string | null) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, categoryId, subCategoryId } : r)));
  }

  function handleSave() {
    if (!analyzed) return;
    startSaveTransition(async () => {
      const result = await saveStatementImportAction({
        year: analyzed.statement.year,
        month: analyzed.statement.month,
        statementDate: analyzed.statement.statementDate,
        periodStart: analyzed.statement.periodStart,
        periodEnd: analyzed.statement.periodEnd,
        fileName: analyzed.fileName,
        previousBalance: analyzed.statement.previousBalance,
        transactions: rows.map((r) => ({
          date: r.date,
          description: r.description,
          amount: r.amount,
          type: r.type,
          categoryId: r.categoryId,
          subCategoryId: r.subCategoryId,
          installmentCurrent: r.installmentCurrent,
          installmentTotal: r.installmentTotal,
        })),
      });

      if (result.status === "success") {
        toast.success(result.message ?? "Ekstre kaydedildi.");
        router.push("/statements");
      } else {
        toast.error(result.message ?? "Ekstre kaydedilemedi.");
      }
    });
  }

  if (phase === "analyzing") {
    return (
      <div className="mx-auto max-w-2xl">
        <AnalysisProgress currentStage={stageIndex} />
      </div>
    );
  }

  if (phase === "preview" && analyzed) {
    return (
      <StatementPreview
        fileName={analyzed.fileName}
        statement={analyzed.statement}
        rows={rows}
        warnings={analyzed.warnings}
        categories={categories}
        saving={saving}
        onCategoryChange={handleCategoryChange}
        onSave={handleSave}
        onCancel={() => router.push("/statements")}
      />
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      {uploadError && (
        <div className="rounded-lg border border-danger/30 bg-danger/10 p-4 text-sm text-danger">
          <p className="font-medium">{uploadError.title}</p>
          <p>{uploadError.description}</p>
        </div>
      )}
      <StatementDropzone onFileAccepted={(file) => void runAnalysis(file)} />
    </div>
  );
}
