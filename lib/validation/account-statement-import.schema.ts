import { z } from "zod";

const nullableId = z.string().min(1).nullable();

const accountLineSchema = z.object({
  date: z.coerce.date(),
  description: z.string().trim().min(1).max(400),
  amount: z.number().int().positive(),
  classification: z.enum(["INCOME", "EXCLUDED"]),
  categoryId: nullableId,
});

/** "Hesap Özetini Kaydet" adımında client'tan gelen düzenlenmiş veriyi doğrular. */
export const accountStatementImportSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  statementDate: z.coerce.date(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  iban: z.string().trim().min(1).nullable(),
  fileName: z.string().trim().min(1).max(255),
  openingBalance: z.number().int(),
  closingBalance: z.number().int(),
  lines: z.array(accountLineSchema).min(1),
});

export type AccountStatementImportInput = z.infer<typeof accountStatementImportSchema>;
