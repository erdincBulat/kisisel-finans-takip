"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { formatMonthYear } from "@/lib/format-date";
import {
  createStatementWithTransactions,
  getStatementByPeriod,
  type CreateStatementTransactionInput,
} from "@/lib/db/statement.service";
import { statementImportSchema } from "@/lib/validation/statement-import.schema";
import { EnparaParser } from "@/lib/pdf/parsers/enpara-parser";
import { validateParsedStatement } from "@/lib/pdf/validate";
import type { ParsedTransaction, ValidationIssue } from "@/lib/pdf/types";
import { suggestCategoriesForTransactions } from "@/lib/categorization/engine";

export type AnalyzeStatementError = {
  status: "error";
  title: string;
  description: string;
};

export type SuggestedParsedTransaction = ParsedTransaction & {
  suggestedCategoryId: string | null;
  suggestedSubCategoryId: string | null;
};

export type AnalyzeStatementSuccess = {
  status: "ok";
  fileName: string;
  statement: {
    year: number;
    month: number;
    statementDate: Date;
    periodStart: Date;
    periodEnd: Date;
    previousBalance: number | null;
  };
  transactions: SuggestedParsedTransaction[];
  warnings: ValidationIssue[];
};

export type AnalyzeStatementResult = AnalyzeStatementError | AnalyzeStatementSuccess;

/** PDF'i okur, ayrıştırır ve duplicate/validation kontrolünden geçirir — henüz DB'ye yazmaz (spec §18). */
export async function analyzeStatementAction(formData: FormData): Promise<AnalyzeStatementResult> {
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { status: "error", title: "Dosya bulunamadı.", description: "Lütfen bir PDF dosyası seçin." };
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) {
    return { status: "error", title: "Geçersiz dosya türü.", description: "Sadece PDF dosyaları kabul edilir." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const parsed = await EnparaParser.parse(buffer).catch((error: unknown) => {
    console.error("Ekstre ayrıştırma başarısız:", error);
    return null;
  });

  if (!parsed) {
    return {
      status: "error",
      title: "PDF okunamadı.",
      description: "Dosyanın geçerli bir Enpara ekstresi olduğundan emin olun.",
    };
  }

  const validation = validateParsedStatement(parsed);
  if (!validation.valid) {
    return {
      status: "error",
      title: "Ekstre işlenemedi.",
      description: validation.issues.find((i) => i.severity === "error")?.message ?? "Ekstre ayrıştırılamadı.",
    };
  }

  const existing = await getStatementByPeriod(parsed.year, parsed.month);
  if (existing) {
    return {
      status: "error",
      title: "Bu ekstre zaten sisteme yüklenmiş.",
      description: `${formatMonthYear(parsed.year, parsed.month)} ekstresi daha önce içe aktarılmış.`,
    };
  }

  // Faz 6: her işlem için kategori önerisi (MerchantRule > bilinen merchant >
  // pattern matching, spec §12) — kullanıcı önizlemede istediği gibi değiştirebilir.
  const suggestions = await suggestCategoriesForTransactions(
    parsed.transactions.map((t) => ({ description: t.description, isBankFee: t.isBankFee })),
  );
  const transactionsWithSuggestions: SuggestedParsedTransaction[] = parsed.transactions.map((t, i) => ({
    ...t,
    suggestedCategoryId: suggestions[i]?.categoryId ?? null,
    suggestedSubCategoryId: suggestions[i]?.subCategoryId ?? null,
  }));

  return {
    status: "ok",
    fileName: file.name,
    statement: {
      year: parsed.year,
      month: parsed.month,
      statementDate: parsed.statementDate,
      periodStart: parsed.periodStart,
      periodEnd: parsed.periodEnd,
      previousBalance: parsed.previousBalance,
    },
    transactions: transactionsWithSuggestions,
    warnings: validation.issues,
  };
}

export type SaveStatementImportInput = {
  year: number;
  month: number;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  fileName: string;
  previousBalance: number | null;
  transactions: CreateStatementTransactionInput[];
};

/** Kullanıcının önizlemede düzenlediği hâliyle ekstreyi ve işlemleri kalıcı olarak kaydeder. */
export async function saveStatementImportAction(input: SaveStatementImportInput): Promise<ActionState> {
  const parsed = statementImportSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Ekstre verisi geçersiz." };
  }
  const data = parsed.data;

  const existing = await getStatementByPeriod(data.year, data.month);
  if (existing) {
    return {
      status: "error",
      message: `${formatMonthYear(data.year, data.month)} ekstresi zaten yüklenmiş. Aynı ekstre ikinci kez içe aktarılamaz.`,
    };
  }

  try {
    await createStatementWithTransactions(data);
  } catch (error) {
    console.error("Ekstre kaydetme başarısız:", error);
    return { status: "error", message: "Ekstre kaydedilemedi." };
  }

  revalidatePath("/statements");
  revalidatePath("/transactions");

  return {
    status: "success",
    message: `${formatMonthYear(data.year, data.month)} ekstresi içe aktarıldı: ${data.transactions.length} işlem eklendi.`,
  };
}
