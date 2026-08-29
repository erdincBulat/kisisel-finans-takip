"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Category } from "@prisma/client";
import { analyzeAccountStatementAction, saveAccountStatementImportAction } from "@/app/income/account-actions";
import type { AnalyzeAccountStatementSuccess } from "@/app/income/account-actions";
import type { ParsedAccountLine, AccountLineClassification } from "@/lib/bank-account/types";
import { takePendingAccountStatementFile } from "@/lib/statement-import/pending-account-upload";
import { StatementDropzone } from "@/components/statements/statement-dropzone";
import { AnalysisProgress, ANALYSIS_STAGES } from "@/components/statements/analysis-progress";
import { AccountStatementPreview } from "./account-statement-preview";

export type EditableAccountLine = Omit<ParsedAccountLine, "suggestedClassification"> & {
  classification: AccountLineClassification;
  categoryId: string | null;
};

type UploadError = { title: string; description: string };
type Phase = "upload" | "analyzing" | "preview";

const STAGE_TICK_MS = 500;

/** `/income/import-account` sayfasının tüm akışını yönetir: upload → analiz → önizleme → kaydet. */
export function AccountStatementImportFlow({ incomeCategories }: { incomeCategories: Category[] }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("upload");
  const [stageIndex, setStageIndex] = useState(0);
  const [uploadError, setUploadError] = useState<UploadError | null>(null);
  const [analyzed, setAnalyzed] = useState<AnalyzeAccountStatementSuccess | null>(null);
  const [rows, setRows] = useState<EditableAccountLine[]>([]);
  const [saving, startSaveTransition] = useTransition();

  useEffect(() => {
    const file = takePendingAccountStatementFile();
    if (file) void runAnalysis(file);
  }, []);

  async function runAnalysis(file: File) {
    setUploadError(null);
    setPhase("analyzing");
    setStageIndex(0);

    const formData = new FormData();
    formData.append("file", file);

    const tickTimer = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, ANALYSIS_STAGES.length - 2));
    }, STAGE_TICK_MS);
    const minDelay = new Promise((resolve) => setTimeout(resolve, STAGE_TICK_MS * (ANALYSIS_STAGES.length - 1)));

    const [result] = await Promise.all([analyzeAccountStatementAction(formData), minDelay]);
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
      result.lines.map(({ suggestedClassification, ...line }) => ({
        ...line,
        classification: suggestedClassification,
        categoryId: null,
      })),
    );
    setPhase("preview");
  }

  function handleClassificationChange(index: number, classification: AccountLineClassification) {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, classification, categoryId: classification === "INCOME" ? r.categoryId : null } : r)),
    );
  }

  function handleCategoryChange(index: number, categoryId: string | null) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, categoryId } : r)));
  }

  function handleSave() {
    if (!analyzed) return;
    startSaveTransition(async () => {
      const result = await saveAccountStatementImportAction({
        year: analyzed.statement.year,
        month: analyzed.statement.month,
        statementDate: analyzed.statement.statementDate,
        periodStart: analyzed.statement.periodStart,
        periodEnd: analyzed.statement.periodEnd,
        iban: analyzed.statement.iban,
        fileName: analyzed.fileName,
        openingBalance: analyzed.statement.openingBalance,
        closingBalance: analyzed.statement.closingBalance,
        lines: rows.map((r) => ({
          date: r.date,
          description: r.description,
          amount: r.amount,
          classification: r.classification,
          categoryId: r.categoryId,
        })),
      });

      if (result.status === "success") {
        toast.success(result.message ?? "Hesap özeti kaydedildi.");
        router.push("/income");
      } else {
        toast.error(result.message ?? "Hesap özeti kaydedilemedi.");
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
      <AccountStatementPreview
        fileName={analyzed.fileName}
        statement={analyzed.statement}
        rows={rows}
        warnings={analyzed.warnings}
        incomeCategories={incomeCategories}
        saving={saving}
        onClassificationChange={handleClassificationChange}
        onCategoryChange={handleCategoryChange}
        onSave={handleSave}
        onCancel={() => router.push("/income")}
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
