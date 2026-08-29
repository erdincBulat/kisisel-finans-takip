"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatementDropzone } from "@/components/statements/statement-dropzone";
import { setPendingAccountStatementFile } from "@/lib/statement-import/pending-account-upload";

/** `/income` üzerindeki hesap özeti yükleme alanı — dosyayı alır ve analiz akışına yönlendirir. */
export function AccountStatementUploadCard() {
  const router = useRouter();

  return (
    <Card>
      <CardContent>
        <StatementDropzone
          onFileAccepted={(file) => {
            setPendingAccountStatementFile(file);
            router.push("/income/import-account");
          }}
        />
      </CardContent>
    </Card>
  );
}
