import type { Statement, TransactionType } from "@prisma/client";
import { prisma } from "./client";
import { computeFingerprint } from "./transaction.service";
import { normalizeMerchant } from "@/lib/merchants/normalize";

export function listStatements() {
  return prisma.statement.findMany({ orderBy: [{ year: "desc" }, { month: "desc" }] });
}

export type StatementWithBalance = Statement & {
  paymentsTotal: number; // kuruş — o dönemde yapılan kart ödemesi (PAYMENT tipi işlemler)
  endingBalance: number | null; // kuruş — dönem sonu kart borcu: previousBalance + totalAmount - paymentsTotal
};

/**
 * Ekstre header'ındaki mutabakat formülü: "Bir önceki ekstre borcu -
 * Ödemeler + Harcamalar/taksitler + Nakit avans + Faiz/vergi/ücret = Ekstre
 * borcu". `totalAmount` zaten harcama+ücret+nakit avansın (PAYMENT hariç,
 * REFUND düşülmüş) toplamı olduğu için formül `previousBalance + totalAmount
 * - paymentsTotal` olarak sadeleşir. Gerçek 6 aylık veride doğrulandı: bir
 * ayın sonucu bir sonraki ayın `previousBalance`'ına birebir eşit çıkıyor —
 * bu yüzden ekstre başına ayrı bir alan saklamaya (migration) gerek yok.
 */
export function computeEndingBalance(previousBalance: number | null, totalAmount: number, paymentsTotal: number): number | null {
  if (previousBalance == null) return null;
  return previousBalance + totalAmount - paymentsTotal;
}

/** Her ekstreyi, o dönemde yapılan ödeme toplamı ve dönem sonu borç bakiyesiyle birlikte listeler. */
export async function listStatementsWithBalances(): Promise<StatementWithBalance[]> {
  const statements = await listStatements();
  if (statements.length === 0) return [];

  const paymentSums = await prisma.transaction.groupBy({
    by: ["statementId"],
    where: { statementId: { in: statements.map((s) => s.id) }, type: "PAYMENT" },
    _sum: { amount: true },
  });
  const paymentsByStatement = new Map(paymentSums.map((p) => [p.statementId, p._sum.amount ?? 0]));

  return statements.map((s) => {
    const paymentsTotal = paymentsByStatement.get(s.id) ?? 0;
    return { ...s, paymentsTotal, endingBalance: computeEndingBalance(s.previousBalance, s.totalAmount, paymentsTotal) };
  });
}

/**
 * En güncel ekstrenin dönem sonu borç bakiyesi — dashboard'daki "Güncel Kart
 * Borcu" kartı için. `statementDate` (kesin gün) döndürülür, `year`/`month`
 * DEĞİL: bir ekstrenin `year`/`month`'u yalnızca *hangi PDF* olduğunu
 * belirtir (spec, bkz. CLAUDE.md), içeriği ağırlıklı olarak BİR ÖNCEKİ
 * takvim ayına ait olabilir (05.08.2026 tarihli "Ağustos" ekstresi, 05/07–
 * 05/08 dönemini kapsıyor — işlemlerin çoğu Temmuz tarihli). "Ağustos 2026
 * ekstresi itibarıyla" gibi ay adına dayanan bir etiket bu yüzden yanıltıcı;
 * tam tarih ("05.08.2026") belirsizlik bırakmaz.
 */
export async function getCurrentCardBalance(): Promise<{ balance: number; statementDate: Date } | null> {
  const [latest] = await listStatementsWithBalances();
  if (!latest || latest.endingBalance == null) return null;
  return { balance: latest.endingBalance, statementDate: latest.statementDate };
}

/** Ekstre benzersizliği year+month üzerinden kontrol edilir (spec §8). */
export function getStatementByPeriod(year: number, month: number) {
  return prisma.statement.findUnique({ where: { year_month: { year, month } } });
}

/**
 * Yanlış PDF yüklendiğinde geri alma yolu: ekstreyle birlikte içe aktarılmış
 * TÜM `Transaction` satırları da siliniyor (yalnızca `statementId`'yi null'a
 * çekmek yeterli değil — o zaman yanlış ekstrenin işlemleri "manuel" gibi
 * DB'de kalmaya devam eder). Başka bir ekstrenin taksit devam satırları
 * (aynı satın almanın sonraki ayki karşılığı) ayrı `Transaction` satırları
 * olduğu için ve yalnızca bu `statementId`'ye sahip satırlar silindiği için
 * etkilenmez. `@@unique([year, month])` guard'ı da bu satır silinince aynı
 * dönemi tekrar yükleyebilmeyi otomatik olarak açar.
 */
export function deleteStatement(id: string) {
  return prisma.$transaction([
    prisma.transaction.deleteMany({ where: { statementId: id } }),
    prisma.statement.delete({ where: { id } }),
  ]);
}

export type CreateStatementTransactionInput = {
  date: Date;
  description: string;
  amount: number; // kuruş
  type: TransactionType;
  categoryId: string | null;
  subCategoryId: string | null;
  installmentCurrent: number | null;
  installmentTotal: number | null;
};

export type CreateStatementInput = {
  year: number;
  month: number;
  statementDate: Date;
  periodStart: Date;
  periodEnd: Date;
  fileName: string;
  previousBalance: number | null;
  transactions: CreateStatementTransactionInput[];
};

/**
 * Net harcama: PAYMENT satırları hariç (kredi kartı borç ödemesi, harcama
 * değildir — bkz. CLAUDE.md TransactionType.PAYMENT notu), REFUND düşülür.
 */
function computeTotalAmount(transactions: CreateStatementTransactionInput[]): number {
  return transactions.reduce((sum, t) => {
    if (t.type === "EXPENSE") return sum + t.amount;
    if (t.type === "REFUND") return sum - t.amount;
    return sum;
  }, 0);
}

/** Statement + tüm transaction'ları tek bir DB transaction'ında oluşturur. */
export function createStatementWithTransactions(input: CreateStatementInput) {
  return prisma.$transaction(async (tx) => {
    const statement = await tx.statement.create({
      data: {
        year: input.year,
        month: input.month,
        statementDate: input.statementDate,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        fileName: input.fileName,
        previousBalance: input.previousBalance,
        transactionCount: input.transactions.length,
        totalAmount: computeTotalAmount(input.transactions),
        status: "IMPORTED",
      },
    });

    if (input.transactions.length > 0) {
      await tx.transaction.createMany({
        data: input.transactions.map((t) => {
          const normalizedMerchant = normalizeMerchant(t.description);
          return {
            date: t.date,
            description: t.description,
            normalizedMerchant,
            amount: t.amount,
            type: t.type,
            source: "STATEMENT" as const,
            categoryId: t.categoryId,
            subCategoryId: t.subCategoryId,
            installmentCurrent: t.installmentCurrent,
            installmentTotal: t.installmentTotal,
            statementId: statement.id,
            fingerprint: computeFingerprint({
              date: t.date,
              normalizedMerchant,
              amount: t.amount,
              installmentCurrent: t.installmentCurrent,
              installmentTotal: t.installmentTotal,
            }),
          };
        }),
      });
    }

    return statement;
  });
}
