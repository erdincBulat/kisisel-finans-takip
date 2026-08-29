# Hesap Özeti Fixture'ları

Kural 7 gereği: gerçek örnek olmadan varsayım yapılıyorsa açıkça belirtilmeli.

## `enpara-account-2026-03-real.txt` ve `enpara-account-2026-07-real.txt` — GERÇEK

`docs/2026 Mart ayı hesap özetiniz.pdf` ve `docs/2026 Temmuz ayı hesap özetiniz.pdf`
dosyalarının `pdf-parse` (`PDFParse.getText()`) ile çıkarılmış **birebir** metin
çıktılarıdır. Kullanıcının yüklediği 6 aylık gerçek hesap özeti serisinden
(Şubat–Temmuz 2026) seçildi — biri çok satırlı/karmaşık işlem örnekleri içerdiği
(bir işlem satırı 4 fiziksel satıra yayılıyor) için (Mart), diğeri "Encard
Harcaması" (banka/debit kartı harcaması) ve "Para Çekme" (ATM) satırlarını
içerdiği için (Temmuz) seçildi.

Bu format, kredi kartı ekstresinden (`tests/parser/fixtures/`) tamamen
FARKLIDIR:

- Tarih 2 haneli yıl kullanıyor (`GG/AA/YY`), kredi kartı ekstresi 4 haneli.
- Her işlem 1-4 fiziksel satıra yayılabiliyor (açıklama uzunsa sarılıyor,
  tutar+bakiye çifti son açıklama satırına eklenmiş ya da tamamen kendi
  satırında olabiliyor).
- Başlık tablosu (`Ad soyad`/`IBAN`/`Ekstre dönemi`/...) pdf-parse'ta
  sütunlar birbirine karışacak kadar dağınık çıkıyor — bu yüzden parser
  yalnızca "Dönem sonu bakiyesi" bloğunu (IBAN + dönem sonu/başı bakiyesi +
  ekstre dönemi, hep aynı sırada 3 ardışık satırda) ve "Ad soyad"/"gün sonu
  itibarıyla" satırlarını hedef alan dar regex'ler kullanıyor, başlığın geri
  kalanını hiç parse etmeye çalışmıyor.

Tüm 6 ay (Şubat–Temmuz) `test-account-parser.mjs` ile (geçici, artık silindi)
tek tek doğrulandı: her ayın hesaplanan bakiye zinciri (`validateParsedAccountStatement`)
SIFIR uyarıyla geçti ve ardışık ayların dönem başı/sonu bakiyeleri birebir
zincirlendi (bir ayın `closingBalance`'ı bir sonrakinin `openingBalance`'ına eşit).
