import { z } from "zod";
import { parseTLToKurus } from "@/lib/money";

/** Form'dan gelen "1.250,50" gibi bir metni kuruşa çeviren paylaşılan zod alanı. */
export const moneyField = z
  .string()
  .min(1, "Tutar zorunludur")
  .transform((val, ctx) => {
    let kurus: number;
    try {
      kurus = parseTLToKurus(val);
    } catch {
      ctx.addIssue({ code: "custom", message: "Geçersiz tutar" });
      return z.NEVER;
    }
    if (!Number.isFinite(kurus) || kurus <= 0) {
      ctx.addIssue({ code: "custom", message: "Tutar sıfırdan büyük olmalıdır" });
      return z.NEVER;
    }
    return kurus;
  });

export const optionalId = z
  .string()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));
