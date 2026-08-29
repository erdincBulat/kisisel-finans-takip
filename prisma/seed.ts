/**
 * Varsayılan kategori ağacını oluşturur (spec §9). Renkler kategori
 * dağılımı grafiklerinde (donut/pie) tutarlı kalması için burada,
 * merkezi olarak atanır (spec §30/§43).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EXPENSE_CATEGORIES: { name: string; color: string; children: string[] }[] = [
  { name: "Günlük Yaşam", color: "#f97316", children: ["Market", "Yemek", "Ulaşım", "Giyim", "Kişisel Bakım"] },
  { name: "Teknoloji", color: "#3b82f6", children: ["Yazılım", "AI", "Donanım", "Hosting", "Dijital Hizmetler"] },
  { name: "Ev", color: "#8b5cf6", children: ["Kira", "Fatura", "Ev", "Diğer"] },
  { name: "Eğlence", color: "#ec4899", children: ["Eğlence", "Oyun", "Sinema", "Seyahat"] },
  { name: "Finans", color: "#14b8a6", children: ["Bankacılık", "Vergi", "Finansal Hizmet", "Diğer"] },
  { name: "Eğitim", color: "#eab308", children: ["Kurs", "Kitap", "Eğitim Hizmetleri"] },
  { name: "Diğer", color: "#64748b", children: [] },
];

const INCOME_CATEGORIES: { name: string; color: string }[] = [
  { name: "Maaş", color: "#22c55e" },
  { name: "Freelance", color: "#06b6d4" },
  { name: "Diğer Gelir", color: "#84cc16" },
];

async function main() {
  for (const main of EXPENSE_CATEGORIES) {
    const parent = await prisma.category.upsert({
      where: { id: `seed-${main.name}` },
      update: {},
      create: { id: `seed-${main.name}`, name: main.name, color: main.color, isIncome: false },
    });

    for (const childName of main.children) {
      await prisma.category.upsert({
        where: { id: `seed-${main.name}-${childName}` },
        update: {},
        create: {
          id: `seed-${main.name}-${childName}`,
          name: childName,
          color: main.color,
          isIncome: false,
          parentId: parent.id,
        },
      });
    }
  }

  for (const income of INCOME_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: `seed-income-${income.name}` },
      update: {},
      create: { id: `seed-income-${income.name}`, name: income.name, color: income.color, isIncome: true },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
