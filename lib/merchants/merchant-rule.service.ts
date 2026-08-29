import { prisma } from "@/lib/db/client";

export function listMerchantRules() {
  return prisma.merchantRule.findMany({
    include: { category: true, subCategory: true },
    orderBy: { normalizedMerchant: "asc" },
  });
}

export type UpdateMerchantRuleInput = {
  categoryId: string;
  subCategoryId: string | null;
};

export function updateMerchantRule(id: string, input: UpdateMerchantRuleInput) {
  return prisma.merchantRule.update({
    where: { id },
    data: { categoryId: input.categoryId, subCategoryId: input.subCategoryId },
  });
}

export function deleteMerchantRule(id: string) {
  return prisma.merchantRule.delete({ where: { id } });
}

export type UpsertMerchantRuleInput = {
  merchantPattern: string;
  normalizedMerchant: string;
  categoryId: string;
  subCategoryId: string | null;
};

/**
 * `merchantPattern` üzerinde DB seviyesinde `@@unique` yok (schema sadece
 * `@@index`) — bu yüzden aynı pattern için tekrar oluşturmak yerine mevcut
 * kuralı güncelliyoruz. Tek kullanıcılı, eşzamanlı olmayan bu uygulamada bu
 * kontrol yeterli (bkz. spec §11: kullanıcı düzeltmesini öğrenme akışı).
 */
export async function upsertMerchantRule(input: UpsertMerchantRuleInput) {
  const existing = await prisma.merchantRule.findFirst({ where: { merchantPattern: input.merchantPattern } });

  if (existing) {
    return prisma.merchantRule.update({
      where: { id: existing.id },
      data: {
        normalizedMerchant: input.normalizedMerchant,
        categoryId: input.categoryId,
        subCategoryId: input.subCategoryId,
      },
    });
  }

  return prisma.merchantRule.create({ data: input });
}
