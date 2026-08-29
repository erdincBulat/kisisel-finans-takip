/**
 * Yalnızca GELİR takip edilir (kullanıcı kararı): hesap özeti verisi sadece
 * `Income`'a yazılır, hiçbir zaman `Transaction`'a değil — /transactions ve
 * dashboard'un harcama tarafı (Toplam Harcama/Trend/Kategori Dağılımı/Son
 * İşlemler/Güncel Kart Borcu) yalnızca kredi kartı verisini yansıtmaya devam
 * eder. Giden hareketler (EFT, Encard harcaması, ATM vb.) önizlemede
 * GÖRÜNÜR (bakiye zincirini doğrulamak ve kullanıcının "evet, tüm çıkışları
 * tanıyorum" diyebilmesi için) ama her zaman HARİÇ TUT olarak işaretlenir —
 * kaydedilmezler.
 */
export type AccountLineClassification = "INCOME" | "EXCLUDED";

export type ParsedAccountLine = {
  date: Date;
  description: string;
  amount: number; // kuruş, her zaman pozitif
  isOutgoing: boolean; // true: hesaptan çıktı (Giden Transfer, Ödeme, Para Çekme, ...), false: hesaba girdi
  balanceAfter: number; // kuruş — işlem sonrası bakiye (PDF'deki "Bakiye" kolonu)
  suggestedClassification: AccountLineClassification;
};

export type ParsedAccountStatement = {
  statementDate: Date;
  accountHolderName: string | null;
  iban: string | null;
  periodStart: Date;
  periodEnd: Date;
  year: number;
  month: number;
  openingBalance: number; // kuruş
  closingBalance: number; // kuruş
  lines: ParsedAccountLine[];
};
