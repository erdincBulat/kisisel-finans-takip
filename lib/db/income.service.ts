import type { Prisma } from "@prisma/client";
import { prisma } from "./client";

export type CreateIncomeInput = {
  date: Date;
  description: string;
  amount: number; // kuruş
  categoryId?: string | null;
  notes?: string | null;
};

export function createIncome(input: CreateIncomeInput) {
  return prisma.income.create({ data: input });
}

export type UpdateIncomeInput = Partial<CreateIncomeInput>;

export function updateIncome(id: string, input: UpdateIncomeInput) {
  return prisma.income.update({ where: { id }, data: input });
}

export function deleteIncome(id: string) {
  return prisma.income.delete({ where: { id } });
}

export function getIncomeById(id: string) {
  return prisma.income.findUnique({ where: { id }, include: { category: true } });
}

export type IncomeFilters = {
  year?: number;
  month?: number;
};

export function listIncomes(filters: IncomeFilters = {}) {
  const where: Prisma.IncomeWhereInput = {};

  if (filters.year && filters.month) {
    const start = new Date(Date.UTC(filters.year, filters.month - 1, 1));
    const end = new Date(Date.UTC(filters.year, filters.month, 1));
    where.date = { gte: start, lt: end };
  }

  return prisma.income.findMany({
    where,
    include: { category: true },
    orderBy: { date: "desc" },
  });
}
