/**
 * JS'in locale-bağımsız `.toLowerCase()`'i Türkçe büyük İ'yi "i" + ayrı bir
 * birleşen nokta işaretine (U+0307) çeviriyor ("Tİ" → "ti̇", 3 kod noktası),
 * bu da alt dize aramalarını sessizce bozuyor: `"Tİ CARET".toLowerCase()`
 * `"ticaret"`i İÇERMEZ. `tr` locale'i (İ→i, I→ı) bunu doğru çözer — bu
 * dosyadaki (ve merchant/kategori eşleştirme kodundaki) tüm case-insensitive
 * karşılaştırmalar bu yüzden `.toLowerCase()` değil `trLower` kullanmalı.
 */
export function trLower(text: string): string {
  return text.toLocaleLowerCase("tr");
}

/**
 * Eşleştirme (matching) amaçlı katlama: `trLower` sonrasında Türkçe'ye özgü
 * harfleri ASCII muadillerine indirger. Gerçek referans ekstrede Türkçe
 * karakter kullanımı TUTARSIZ — aynı belgede "ELEKTRI" düz ASCII I ile,
 * "TİCARET" ise düzgün Türkçe İ ile geçiyor (bkz. tests/parser/fixtures/
 * enpara-2026-08-real.txt). `trLower` tek başına "I"yı Türkçe kuralına göre
 * "ı" yapar (İ değil), bu da ASCII yazılmış "ELEKTRI"yi "elektrı" yapıp
 * "elektrik" anahtar kelimesiyle eşleşmeyi bozar. Bu fonksiyon SADECE
 * karşılaştırma için kullanılmalı — görüntülenen adları (`normalizeMerchant`
 * çıktısı gibi) bu katlamadan geçirme, okunabilirliği bozar.
 */
export function matchFold(text: string): string {
  return trLower(text)
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u");
}
