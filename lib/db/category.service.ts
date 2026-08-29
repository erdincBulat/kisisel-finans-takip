import { Prisma } from "@prisma/client";
import { prisma } from "./client";

export type CategoryInUseReason = "TRANSACTIONS" | "CHILDREN" | "OTHER";

export class CategoryInUseError extends Error {
  reason: CategoryInUseReason;

  constructor(message: string, reason: CategoryInUseReason = "OTHER") {
    super(message);
    this.reason = reason;
  }
}

export function listCategoryTree() {
  return prisma.category.findMany({
    where: { parentId: null },
    include: { children: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export function getCategoryById(id: string) {
  return prisma.category.findUnique({ where: { id } });
}

export type CreateCategoryInput = {
  name: string;
  color: string;
  isIncome?: boolean;
  parentId?: string | null;
};

export function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: {
      name: input.name,
      color: input.color,
      isIncome: input.isIncome ?? false,
      parentId: input.parentId ?? null,
    },
  });
}

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export function updateCategory(id: string, input: UpdateCategoryInput) {
  return prisma.category.update({ where: { id }, data: input });
}

/**
 * Kategori silmeden önce koruma kontrolleri (spec §9): işlem içeren kategoriler
 * doğrudan silinemez, önce alt kategoriler taşınmalı/silinmeli.
 */
export async function deleteCategory(id: string) {
  const [transactionCount, childCount] = await Promise.all([
    prisma.transaction.count({
      where: { OR: [{ categoryId: id }, { subCategoryId: id }] },
    }),
    prisma.category.count({ where: { parentId: id } }),
  ]);

  if (transactionCount > 0) {
    throw new CategoryInUseError(
      `Bu kategoride ${transactionCount} işlem bulunuyor. Silmeden önce işlemleri başka bir kategoriye taşımalısınız.`,
      "TRANSACTIONS",
    );
  }

  if (childCount > 0) {
    throw new CategoryInUseError(
      `Bu kategorinin ${childCount} alt kategorisi var. Önce alt kategorileri taşımalı veya silmelisiniz.`,
      "CHILDREN",
    );
  }

  try {
    await prisma.category.delete({ where: { id } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw new CategoryInUseError(
        "Bu kategori başka kayıtlarda (bütçe, gelir veya merchant kuralı) kullanılıyor, silinemedi.",
        "OTHER",
      );
    }
    throw error;
  }
}

/**
 * Silinemeyen (işlem içeren) bir kategorideki TÜM referansları (Transaction,
 * MerchantRule, Budget, Income) `toId`'ye taşır, ardından `fromId`'yi siler.
 * Yalnızca aynı seviyedeki (ikisi de ana ya da ikisi de alt) ve aynı
 * gelir/gider türündeki kategoriler arasında taşımaya izin verilir — bkz.
 * spec §9, kategori yönetimini kolaylaştırma isteği.
 */
export async function moveCategoryTransactionsAndDelete(fromId: string, toId: string): Promise<number> {
  const [from, to, childCount] = await Promise.all([
    prisma.category.findUnique({ where: { id: fromId } }),
    prisma.category.findUnique({ where: { id: toId } }),
    prisma.category.count({ where: { parentId: fromId } }),
  ]);

  if (!from || !to) throw new CategoryInUseError("Kategori bulunamadı.");
  if (from.id === to.id) throw new CategoryInUseError("Kaynak ve hedef kategori aynı olamaz.");
  if ((from.parentId === null) !== (to.parentId === null)) {
    throw new CategoryInUseError("Ana kategori yalnızca ana kategoriye, alt kategori yalnızca alt kategoriye taşınabilir.");
  }
  if (from.isIncome !== to.isIncome) {
    throw new CategoryInUseError("Gelir ve gider kategorileri arasında taşıma yapılamaz.");
  }
  if (childCount > 0) {
    throw new CategoryInUseError(
      `Bu kategorinin ${childCount} alt kategorisi var. Önce alt kategorileri taşımalı veya silmelisiniz.`,
      "CHILDREN",
    );
  }

  const isSub = from.parentId !== null;

  const transactionCount = await prisma.transaction.count({
    where: isSub ? { subCategoryId: fromId } : { categoryId: fromId },
  });

  await prisma.$transaction(async (tx) => {
    if (isSub) {
      const data = { categoryId: to.parentId!, subCategoryId: toId };
      await tx.transaction.updateMany({ where: { subCategoryId: fromId }, data });
      await tx.merchantRule.updateMany({ where: { subCategoryId: fromId }, data });
      await tx.budget.updateMany({ where: { subCategoryId: fromId }, data });
    } else {
      const data = { categoryId: toId, subCategoryId: null };
      await tx.transaction.updateMany({ where: { categoryId: fromId }, data });
      await tx.merchantRule.updateMany({ where: { categoryId: fromId }, data });
      await tx.budget.updateMany({ where: { categoryId: fromId }, data });
      await tx.income.updateMany({ where: { categoryId: fromId }, data: { categoryId: toId } });
    }
    await tx.category.delete({ where: { id: fromId } });
  });

  return transactionCount;
}
