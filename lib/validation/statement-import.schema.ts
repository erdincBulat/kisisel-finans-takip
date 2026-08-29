import { z } from "zod";

// Client'tan FormData değil düz obje geldiği için (analiz sonucu React state'inde
// tutulur), money-field.ts'teki `optionalId` (string|undefined) değil, burada
// doğrudan string|null kabul eden bir şema kullanılır.
const nullableId = z.string().min(1).nullable();

const statementImportTransactionSchema = z.object({
  date: z.coerce.date(),
  description: z.string().trim().min(1).max(300),
  amount: z.number().int().positive(),
  type: z.enum(["EXPENSE", "REFUND", "PAYMENT"]),
  categoryId: nullableId,
  subCategoryId: nullableId,
  installmentCurrent: z.number().int().positive().nullable(),
  installmentTotal: z.number().int().positive().nullable(),
});

/** "Ekstreyi Kaydet" adımında client'tan gelen düzenlenmiş veriyi doğrular. */
export const statementImportSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  statementDate: z.coerce.date(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  fileName: z.string().trim().min(1).max(255),
  previousBalance: z.number().int().nullable(),
  transactions: z.array(statementImportTransactionSchema).min(1),
});

export type StatementImportInput = z.infer<typeof statementImportSchema>;
