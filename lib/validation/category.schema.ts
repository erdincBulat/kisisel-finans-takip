import { z } from "zod";
import { optionalId } from "./money-field";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Ad zorunludur").max(60),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Geçerli bir renk seçin"),
  isIncome: z
    .union([z.literal("on"), z.literal("off"), z.undefined()])
    .transform((v) => v === "on"),
  parentId: optionalId,
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;
