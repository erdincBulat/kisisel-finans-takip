import { listStatementsWithBalances } from "@/lib/db/statement.service";
import { StatementUploadCard } from "@/components/statements/statement-upload-card";
import { StatementsTable } from "@/components/statements/statements-table";

export default async function StatementsPage() {
  const statements = await listStatementsWithBalances();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Ekstreler</h1>
        <p className="text-sm text-muted-foreground">
          Enpara kredi kartı ekstrenizi yükleyin; işlemler otomatik ayrıştırılıp önizleme için hazırlanır.
        </p>
      </div>

      <StatementUploadCard />
      <StatementsTable statements={statements} />
    </div>
  );
}
