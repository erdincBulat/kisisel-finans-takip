# Parser Fixture'ları

Kural 7 gereği: gerçek örnek olmadan varsayım yapılıyorsa açıkça belirtilmeli.

## `enpara-2026-08-real.txt` — GERÇEK

`05.08.2026 tarihli Enpara.com Kredi Kartı ekstreniz.pdf` dosyasının `pdf-parse`
(`PDFParse.getText()`) ile çıkarılmış **birebir** metin çıktısıdır (bkz.
`docs/05.08.2026 tarihli Enpara.com Kredi Kartı ekstreniz.pdf`). Satır sonları,
sayfa geçişi işaretçileri (`-- 1 of 2 --`) ve tekrarlanan tablo başlıkları dahil
hiçbir şey elle değiştirilmedi. Parser'ın asıl doğruluk referansı budur.

Bu ekstrede **hiç taksitli işlem yok** — Taksit kolonu tüm satırlarda boş.

## `enpara-2026-03-installment-real.txt` — GERÇEK (taksitli)

`05.03.2026 tarihli Enpara.com Kredi Kartı ekstreniz.pdf` dosyasının **birebir**
`pdf-parse` çıktısıdır — kullanıcının yüklediği 6 aylık gerçek ekstre serisinden
(Mart–Ağustos 2026), ilk kez gerçek bir taksitli işlem içeren örnek.

Gerçek format aşağıdaki hypothetical fixture'daki varsayımdan **farklı** çıktı:

```
29/01/2026 TRENDYOL.COM ISTANBUL TR (849,00 TL) 2/3 283,00 TL
```

Taksit öbeği ("2/3") satırın SONUNDAKİ tutardan (283,00 TL — taksit başına
ödenen, TOPLAM fiyat değil) hemen önce geliyor, ama açıklamanın kendisi de
parantez içinde toplam fiyatı ("849,00 TL") taşıyor. `extractInstallmentToken`
sadece "açıklamanın sonunda N/M" yapısal kuralına dayandığı için (parantez
içeriğine bakmadan) bu gerçek satırı **hiçbir kod değişikliği gerekmeden**
doğru ayrıştırdı — `849,00 TL` kısmı açıklamanın bir parçası olarak korundu,
bu istenen davranış (spec: "PDF'den gelen orijinal metin korunur").

Aynı taksit dizisinin devamı (`3/3`) `05.04.2026` ekstresinde de gerçek veride
doğrulandı (ayrı fixture olarak eklenmedi, tek satırlık aynı format).

## `enpara-hypothetical-installment.txt` — VARSAYIMSAL (artık sadece referans)

⚠️ Bu fixture **gerçek bir ekstreden alınmamıştır** — spec §22'deki örnekten
("Apple 6.000 TL 3/6") yola çıkılarak elle üretilmişti. Gerçek veri (yukarıya
bkz.) format detayında bu varsayımdan **farklı** çıktı (toplam fiyat parantez
içinde ayrıca var, satır sonundaki tutar taksit başına), ama
`extractInstallmentToken`'ın "sondaki N/M" mekanizması yapısal olduğu için
gerçek veride de sorunsuz çalıştı. Bu fixture artık aktif bir belirsizliği
temsil etmiyor, sadece extractInstallmentToken'ın basit-vaka testinde kalıyor —
silinmesine gerek yok.
