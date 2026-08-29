/**
 * `/statements` sayfasındaki drop alanına bırakılan dosyayı, client-side
 * navigasyonla `/statements/import` sayfasına taşımak için geçici bellek içi
 * depo. Next.js App Router'da client-side geçişler JS runtime'ı sıfırlamadığı
 * için modül seviyesindeki bu değişken iki sayfa arasında hayatta kalır.
 *
 * `/statements/import` sayfasına doğrudan URL ile gelinirse (bekleyen dosya
 * yoksa) o sayfa kendi drop alanını gösterip buradan bağımsız devam eder.
 */
let pendingFile: File | null = null;

export function setPendingStatementFile(file: File): void {
  pendingFile = file;
}

/** Dosyayı döner ve depoyu temizler (tek seferlik tüketim). */
export function takePendingStatementFile(): File | null {
  const file = pendingFile;
  pendingFile = null;
  return file;
}
