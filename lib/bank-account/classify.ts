import { matchFold } from "@/lib/merchants/text";
import type { AccountLineClassification } from "./types";

/**
 * Bir hesap özeti satırının önerilen sınıfı — yalnızca GELİR takip edildiği
 * için (bkz. types.ts) basit bir kural: hesaba giren her hareket Gelir
 * önerilir, hesaptan çıkan HER ŞEY (EFT, Encard harcaması, ATM, kredi kartı
 * ödemesi, yatırım transferi, ...) Hariç Tut önerilir — ayrıca bir "gider"
 * kategorisi yok, hepsi zaten hariç tutuluyor.
 *
 * Tek özel durum: kendi hesabınıza gelen transferler (aynı ad soyad) gerçek
 * gelir değildir, kendi paranızın başka bir hesabınızdan bu hesaba taşınmasıdır
 * — bu yüzden yön pozitif olsa bile Hariç Tut önerilir. `accountHolderName`
 * PDF'in kendi başlığından çıkarılır (bkz. parse-account-statement.ts),
 * kaynak koda gömülü bir isim DEĞİLDİR.
 *
 * Bunlar sadece bir ÖN SEÇİM — önizleme ekranında her satır tek tek
 * değiştirilebilir (spec'in "asla sessizce varsayma" ilkesi).
 */
export function suggestLineClassification(
  description: string,
  isOutgoing: boolean,
  accountHolderName: string | null,
): AccountLineClassification {
  if (isOutgoing) return "EXCLUDED";

  if (accountHolderName) {
    const folded = matchFold(description);
    const holderFolded = matchFold(accountHolderName);
    const selfTransferPattern = new RegExp(`^gelen transfer,\\s*${holderFolded.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")},`);
    if (selfTransferPattern.test(folded)) return "EXCLUDED";
  }

  return "INCOME";
}
