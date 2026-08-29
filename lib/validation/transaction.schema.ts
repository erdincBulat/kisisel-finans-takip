import { z } from "zod";
import { moneyField, optionalId } from "./money-field";

export const transactionFormSchema = z
  .object({
    date: z.string().min(1, "Tarih zorunludur"),
    description: z.string().trim().min(1, "Açıklama zorunludur").max(200),
    amount: moneyField,
    type: z.enum(["EXPENSE", "REFUND"]),
    categoryId: z.string().min(1, "Kategori zorunludur"),
    subCategoryId: optionalId,
    installmentCurrent: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? Number(v) : null)),
    installmentTotal: z
      .string()
      .optional()
      .transform((v) => (v && v.length > 0 ? Number(v) : null)),
    notes: z
      .string()
      .max(500)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : null)),
  })
  .refine(
    (data) => (data.installmentCurrent == null) === (data.installmentTotal == null),
    { message: "Taksit no ve toplam taksit birlikte girilmelidir", path: ["installmentTotal"] },
  )
  .refine(
    (data) =>
      data.installmentCurrent == null ||
      (data.installmentTotal != null && data.installmentCurrent <= data.installmentTotal),
    { message: "Taksit no, toplam taksitten büyük olamaz", path: ["installmentCurrent"] },
  );

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;
