"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { StatementDropzone } from "./statement-dropzone";
import { setPendingStatementFile } from "@/lib/statement-import/pending-upload";

/** `/statements` üzerindeki yükleme alanı — dosyayı alır ve analiz akışına yönlendirir. */
export function StatementUploadCard() {
  const router = useRouter();

  return (
    <Card>
      <CardContent>
        <StatementDropzone
          onFileAccepted={(file) => {
            setPendingStatementFile(file);
            router.push("/statements/import");
          }}
        />
      </CardContent>
    </Card>
  );
}
