import fs from "node:fs/promises";
import Link from "next/link";
import { ArrowLeft, Database, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDatabaseFilePath } from "@/lib/db/backup";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function DataManagementPage() {
  const filePath = getDatabaseFilePath();
  const stat = await fs.stat(filePath).catch(() => null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/settings"
          className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Ayarlar
        </Link>
        <h1 className="text-2xl font-semibold">Veri Yönetimi</h1>
        <p className="text-sm text-muted-foreground">
          Tüm verileriniz yalnızca bu bilgisayardaki bir SQLite dosyasında saklanır — bulut yok, hesap yok,
          otomatik yedekleme yok. Veri kaybını önlemek için dosyayı düzenli olarak kendiniz kopyalayın.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="size-4 text-muted-foreground" />
            <CardTitle className="text-base font-medium">Veritabanı Dosyası</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <div className="text-muted-foreground">Konum</div>
              <div className="break-all font-mono text-xs">{filePath}</div>
            </div>
            {stat && (
              <>
                <div>
                  <div className="text-muted-foreground">Boyut</div>
                  <div>{formatBytes(stat.size)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Son değişiklik</div>
                  <div>{dateFormatter.format(stat.mtime)}</div>
                </div>
              </>
            )}
          </div>

          <div>
            <Button render={<a href="/settings/data/download" />} nativeButton={false}>
              <Download className="size-4" /> Dosyayı İndir
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">
              Uygulamada aktif bir işlem yapmadığınız bir anda indirmeniz tutarlı bir yedek almanızı sağlar.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
