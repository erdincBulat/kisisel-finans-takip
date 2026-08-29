import { z } from "zod";
import { moneyField, optionalId } from "./money-field";

export const incomeFormSchema = z.object({
  date: z.string().min(1, "Tarih zorunludur"),
  description: z.string().trim().min(1, "Açıklama zorunludur").max(200),
  amount: moneyField,
  categoryId: optionalId,
  notes: z
    .string()
    .max(500)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});

export type IncomeFormValues = z.infer<typeof incomeFormSchema>;
