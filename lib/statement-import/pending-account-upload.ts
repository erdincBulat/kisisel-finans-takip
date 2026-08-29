/**
 * `pending-upload.ts` ile aynı mantık, hesap özeti (banka hareketleri) akışı
 * için ayrı bir depo — kredi kartı ekstresi ile aynı anda karışmasın diye.
 */
let pendingFile: File | null = null;

export function setPendingAccountStatementFile(file: File): void {
  pendingFile = file;
}

export function takePendingAccountStatementFile(): File | null {
  const file = pendingFile;
  pendingFile = null;
  return file;
}
