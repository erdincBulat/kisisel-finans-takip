import { z } from "zod";
import { moneyField, optionalId } from "./money-field";

export const budgetFormSchema = z.object({
  categoryId: z.string().min(1, "Kategori zorunludur"),
  subCategoryId: optionalId,
  limitAmount: moneyField,
});

export type BudgetFormValues = z.infer<typeof budgetFormSchema>;
