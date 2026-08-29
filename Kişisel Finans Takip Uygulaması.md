# Kişisel Finans Takip Uygulaması
## Proje Teknik ve Ürün Gereksinimleri

## 1. Proje Özeti

Bu proje yalnızca kişisel kullanım için geliştirilecek, lokal ortamda çalışan bir **kişisel finans ve harcama takip uygulamasıdır**.

Uygulamanın temel amacı:

> Enpara kredi kartı ekstre PDF'sini yüklemek → işlemleri otomatik çıkarmak → kategorize etmek → geçmiş verilerle birlikte saklamak → aylık finansal durumu analiz etmek.

Uygulama internete açık olmayacak ve çok kullanıcılı bir SaaS olmayacaktır.

Authentication, üyelik, ödeme sistemi, kullanıcı yönetimi ve cloud altyapısı MVP kapsamında değildir.

Uygulama öncelikle localhost üzerinde çalışacaktır.

---

# 2. Temel Kullanım Senaryosu

Kullanıcı her ay Enpara kredi kartı ekstresini PDF olarak uygulamaya yükler.

Örnek:

```text
Ağustos 2026 Enpara Ekstresi.pdf
```

Uygulama:

1. PDF'yi okur.
2. Ekstre dönemini tespit eder.
3. Ekstrenin daha önce yüklenip yüklenmediğini kontrol eder.
4. İşlemleri çıkarır.
5. İşlem bilgilerini normalize eder.
6. Daha önce öğrenilmiş merchant/category kurallarını uygular.
7. Yeni işlemler için otomatik kategori belirler.
8. Taksit bilgilerini analiz eder.
9. Muhtemel abonelikleri tespit eder.
10. Kullanıcıya sonuçları gösterir.
11. Kullanıcı hatalı kategorileri düzeltebilir.
12. Yapılan düzeltmeler gelecekte kullanılmak üzere hafızaya alınır.
13. Dashboard ve aylık istatistikler güncellenir.

---

# 3. Ana Ürün Prensipleri

Uygulama şu prensiplere göre geliştirilecektir:

- Öncelik doğruluk.
- Finansal veriler lokal tutulmalıdır.
- Temel özellikler AI olmadan çalışmalıdır.
- AI zorunlu dependency olmamalıdır.
- Kullanıcı tarafından yapılan kategori düzeltmeleri öğrenilmelidir.
- Aynı ekstre ikinci kez yüklenememelidir.
- Geçmiş aylardaki veriler korunmalıdır.
- Taksitli işlemler gelecek aylara yansıtılmalıdır.
- Kullanıcı her otomatik işlemi düzenleyebilmelidir.
- Uygulama gereksiz kompleks hale getirilmemelidir.
- MVP çalışır hale gelmeden ileri seviye özelliklere geçilmemelidir.

---

# 4. Teknoloji Stack

Tercih edilen stack:

## Frontend

- Next.js
- TypeScript
- React
- Tailwind CSS
- shadcn/ui

## Backend

Next.js server-side API / Server Actions.

## Database

SQLite.

## ORM

Prisma.

## Grafik

Recharts veya benzer hafif React chart kütüphanesi.

## PDF

PDF metin çıkarma için uygun Node.js PDF parser kullanılmalıdır.

Öncelik:

1. Metin tabanlı PDF parsing
2. Gerekirse OCR desteği

İlk aşamada OCR eklenmemelidir. Enpara PDF'sinin metin yapısı test edilmelidir.

## AI

MVP'de AI zorunlu değildir.

Kategori sistemi öncelikle:

- Merchant kuralları
- Kategori hafızası
- Basit pattern matching
- Bilinen merchant listesi

üzerinden çalışmalıdır.

İleride AI adapter eklenebilecek şekilde mimari hazırlanmalıdır.

AI kullanılacaksa ücretsiz/local modeller öncelikli düşünülmelidir.

Örneğin ileride Ollama entegrasyonu eklenebilir.

---

# 5. Proje Yapısı

Tercih edilen yapı:

```text
/
├── app/
│   ├── page.tsx
│   ├── dashboard/
│   ├── transactions/
│   ├── statements/
│   ├── categories/
│   ├── subscriptions/
│   ├── installments/
│   ├── budgets/
│   ├── reports/
│   └── settings/
│
├── components/
│   ├── dashboard/
│   ├── transactions/
│   ├── statements/
│   ├── charts/
│   ├── categories/
│   ├── subscriptions/
│   ├── installments/
│   └── ui/
│
├── lib/
│   ├── db/
│   ├── pdf/
│   ├── parser/
│   ├── categorization/
│   ├── merchants/
│   ├── installments/
│   ├── subscriptions/
│   ├── analytics/
│   ├── budgets/
│   └── ai/
│
├── prisma/
│   └── schema.prisma
│
├── data/
│   └── finance.db
│
├── tests/
│   ├── parser/
│   ├── categorization/
│   ├── installments/
│   └── analytics/
│
├── public/
│
├── README.md
├── PROJECT_SPEC.md
├── package.json
└── .env
```

Klasör yapısı gerektiğinde değiştirilebilir ancak sorumluluklar birbirinden ayrılmalıdır.

---

# 6. Database

SQLite + Prisma kullanılmalıdır.

Temel modeller:

```text
Transaction
Category
MerchantRule
Statement
Subscription
Installment
Budget
Income
Setting
```

---

# 7. Transaction Model

Her finansal işlem için:

```text
Transaction

id
date
description
normalizedMerchant
amount
type
categoryId
subCategoryId
installmentCurrent
installmentTotal
source
statementId
notes
createdAt
updatedAt
```

## type

En az:

```text
EXPENSE
INCOME
REFUND
```

olabilir.

## source

```text
STATEMENT
MANUAL
```

olabilir.

PDF'den gelen işlem `STATEMENT`, manuel eklenen işlem `MANUAL` olmalıdır.

---

# 8. Statement Model

Her PDF ekstresi için:

```text
Statement

id
year
month
periodStart
periodEnd
fileName
uploadedAt
transactionCount
totalAmount
status
```

Ekstre benzersizliği:

```text
year + month
```

üzerinden kontrol edilmelidir.

Aynı ayın ekstresi ikinci kez yüklenmeye çalışılırsa import yapılmamalıdır.

Örneğin Ağustos 2026 zaten mevcutsa:

```text
Ağustos 2026 ekstresi zaten yüklenmiş.
Aynı ekstre ikinci kez içe aktarılamaz.
```

mesajı gösterilmelidir.

Dosya adı üzerinden duplicate kontrolü yapılmamalıdır.

---

# 9. Category Model

Kategori sistemi iki seviyeli olacaktır:

```text
Ana Kategori
    └── Alt Kategori
```

Örnek:

```text
Teknoloji
    ├── Yazılım
    ├── AI
    ├── Donanım
    ├── Hosting
    └── Dijital Hizmetler
```

Başlangıç kategorileri:

## Günlük Yaşam

- Market
- Yemek
- Ulaşım
- Giyim
- Kişisel Bakım

## Teknoloji

- Yazılım
- AI
- Donanım
- Hosting
- Dijital Hizmetler

## Ev

- Kira
- Fatura
- Ev
- Diğer

## Eğlence

- Eğlence
- Oyun
- Sinema
- Seyahat

## Finans

- Bankacılık
- Vergi
- Finansal Hizmet
- Diğer

## Eğitim

- Kurs
- Kitap
- Eğitim Hizmetleri

## Diğer

Kullanıcı yeni ana kategori ve alt kategori oluşturabilmelidir.

Kullanıcı kategori adını değiştirebilmeli ve kategori silebilmelidir.

Ancak içerisinde işlem bulunan kategorilerin doğrudan silinmesi yerine:

```text
Bu kategoride 14 işlem bulunuyor.
Silmeden önce işlemleri başka bir kategoriye taşımalısınız.
```

uyarısı tercih edilmelidir.

---

# 10. Merchant Normalization

Ekstrelerde aynı işletme farklı şekillerde görünebilir.

Örneğin:

```text
AMZN*12345
AMAZON TR
AMAZON.COM
AMZN MKT
```

Bunların hepsi:

```text
Amazon
```

olarak normalize edilebilmelidir.

Ayrı bir merchant normalization katmanı oluşturulmalıdır.

Örneğin:

```text
normalizeMerchant(description)
```

fonksiyonu kullanılabilir.

Merchant normalization sistemi:

1. Gereksiz transaction kodlarını temizler.
2. Büyük/küçük harf farklılıklarını düzeltir.
3. Gereksiz boşlukları kaldırır.
4. Bilinen merchant eşleşmelerini uygular.
5. MerchantRule kayıtlarını kontrol eder.
6. Sonuç olarak standart merchant adı üretir.

---

# 11. MerchantRule

Kullanıcının kategori düzeltmeleri öğrenilmelidir.

Model:

```text
MerchantRule

id
merchantPattern
normalizedMerchant
categoryId
subCategoryId
createdAt
updatedAt
```

Örneğin:

```text
merchantPattern:
amazon

normalizedMerchant:
Amazon

category:
Teknoloji

subcategory:
Donanım
```

Bir kullanıcı Amazon işlemini Teknoloji → Donanım olarak değiştirdiğinde sistem:

```text
Gelecekte Amazon işlemlerini de bu kategoriye ata?
```

diye sorabilir.

Kullanıcı kabul ederse MerchantRule oluşturulmalıdır.

---

# 12. Kategori Belirleme Önceliği

Bir işlem için kategori belirlenirken şu sıra kullanılmalıdır:

```text
1. Manuel kullanıcı seçimi
2. MerchantRule
3. Bilinen merchant eşleşmesi
4. Pattern matching
5. AI varsa AI önerisi
6. Diğer
```

AI hiçbir zaman kullanıcının kesin olarak belirlediği kategori kuralını ezmemelidir.

---

# 13. PDF Import Sistemi

PDF yükleme ekranı oluşturulmalıdır.

Drag & Drop desteklenmelidir.

Örnek:

```text
┌────────────────────────────────────┐
│                                    │
│     Ekstre PDF'sini buraya bırak   │
│                                    │
│              veya                  │
│          Dosya Seç                 │
│                                    │
└────────────────────────────────────┘
```

Sadece PDF kabul edilmelidir.

---

# 14. PDF Analiz Süreci

PDF yüklenince kullanıcıya analiz ekranı gösterilmelidir.

Örnek:

```text
Ekstre analiz ediliyor...

✓ PDF okunuyor
✓ Ekstre dönemi belirleniyor
✓ İşlemler çıkarılıyor
● İşlemler kategorize ediliyor
○ Taksitler analiz ediliyor
○ Sonuçlar hazırlanıyor
```

Animasyonlu progress göstergesi kullanılmalıdır.

Gerçek işlem süreleri bilinmediği için sahte kesin yüzde gösterilmemelidir.

Örneğin:

```text
37%
```

gibi rastgele progress yerine aşama tabanlı progress kullanılmalıdır.

---

# 15. PDF'den Çıkarılacak Veriler

Her işlem için yalnızca şu 5 temel veri zorunludur:

1. Tarih
2. İşlem açıklaması
3. Tutar
4. İşlem türü
5. Taksit bilgisi

Örnek:

```text
15.08.2026
Amazon
2.499,90 TL
Harcama
2/3
```

Uygulama daha sonra kendi metadata'sını ekler:

```text
normalizedMerchant
category
subcategory
source
statement
```

---

# 16. PDF Parser Tasarımı

Parser doğrudan UI içinde yazılmamalıdır.

Örneğin:

```text
lib/pdf/
    extract-text.ts
    parse-statement.ts
    normalize-transaction.ts
```

gibi ayrıştırılmalıdır.

Ana fonksiyon:

```text
parseEnparaStatement(pdf)
```

şu sonucu döndürmelidir:

```typescript
{
  statement: {
    periodStart,
    periodEnd,
    year,
    month
  },
  transactions: [
    {
      date,
      description,
      amount,
      type,
      installmentCurrent,
      installmentTotal
    }
  ]
}
```

Parser test edilebilir olmalıdır.

---

# 17. PDF Parser Güvenilirliği

PDF parsing finansal uygulamanın en kritik bölümüdür.

Parser:

- Tarihleri doğru okumalı.
- Türkçe sayı formatlarını doğru çevirmeli.
- `1.250,50 TL` değerini `1250.50` olarak kaydetmeli.
- Eksi/pozitif işlemleri doğru yorumlamalı.
- Taksit bilgisini doğru ayırmalı.
- PDF içerisindeki toplamları transaction olarak yanlışlıkla eklememeli.
- Sayfa başlıklarını transaction olarak algılamamalı.
- Ekstre toplamlarını transaction olarak algılamamalı.

Parser'dan çıkan veriler database'e yazılmadan önce validation'dan geçmelidir.

---

# 18. Import Preview

PDF analizinden sonra doğrudan database'e yazmak yerine preview ekranı gösterilmelidir.

Örneğin:

```text
Ağustos 2026

87 işlem bulundu.

Toplam:
₺32.840,50

Otomatik kategorize:
84

Kategori bekleyen:
3
```

Altında işlemler:

```text
Tarih       Merchant       Tutar       Kategori
-------------------------------------------------
15 Ağu      Amazon         ₺2.499      Teknoloji
14 Ağu      Migros         ₺840        Market
13 Ağu      Uber           ₺420        Ulaşım
```

Kullanıcı işlemleri düzenleyebilmelidir.

Son adım:

```text
[ Ekstreyi Kaydet ]
```

olmalıdır.

---

# 19. Belirsiz Kategoriler

Sistem kategorisinden emin olmadığı işlemleri:

```text
Kategori seçilmedi
```

olarak işaretlemelidir.

Örneğin:

```text
3 işlem için kategori seçmeniz gerekiyor.
```

Kullanıcı bunları manuel seçmelidir.

---

# 20. Manuel Harcama

Kullanıcı PDF'de bulunmayan harcamaları manuel ekleyebilmelidir.

Form:

```text
Tarih
Açıklama
Tutar
Kategori
Alt Kategori
Taksit
Not
```

Source:

```text
MANUAL
```

olarak kaydedilmelidir.

---

# 21. Manuel Gelir

Kullanıcı gelir ekleyebilmelidir.

Örneğin:

```text
Maaş
Freelance
Web Tasarım Projesi
Diğer
```

Gelir modeli:

```text
Income

id
date
description
amount
category
notes
createdAt
updatedAt
```

Dashboard'da gelir ve gider ayrı gösterilmelidir.

---

# 22. Taksit Sistemi

Taksitli işlemler desteklenmelidir.

Örnek:

```text
Apple
6.000 TL
3/6
```

Bu işlem:

```text
3. taksit / 6 taksit
```

anlamına gelir.

Sistem gelecekteki taksitleri hesaplamalıdır.

Örneğin:

```text
Ağustos    6.000 TL
Eylül      6.000 TL
Ekim       6.000 TL
Kasım      6.000 TL
Aralık     6.000 TL
Ocak       6.000 TL
```

Ancak geçmiş taksitler tekrar harcama olarak sayılmamalıdır.

---

# 23. Taksit Veri Modeli

Gerekirse Transaction'dan ayrı:

```text
Installment

id
transactionId
currentInstallment
totalInstallments
installmentAmount
startDate
endDate
status
```

oluşturulmalıdır.

Status:

```text
ACTIVE
COMPLETED
```

olabilir.

---

# 24. Gelecek Taksitler

Dashboard'da:

```text
Gelecek Taksitler
```

alanı bulunmalıdır.

Örnek:

```text
Eylül 2026     ₺7.840
Ekim 2026      ₺6.250
Kasım 2026     ₺4.100
Aralık 2026    ₺2.800
```

Kullanıcı ayrıca detay ekranından hangi işlemlerin bu toplamı oluşturduğunu görebilmelidir.

---

# 25. Abonelik Tespiti

Uygulama tekrar eden işlemleri analiz etmelidir.

Örneğin:

```text
ChatGPT
Haziran
Temmuz
Ağustos
```

gibi düzenli işlemler varsa:

```text
Muhtemel Abonelik
```

olarak işaretlenmelidir.

Abonelik otomatik olarak kesin kabul edilmemelidir.

Kullanıcı onaylayabilmelidir.

---

# 26. Subscription Model

```text
Subscription

id
merchant
averageAmount
frequency
lastChargeDate
nextExpectedDate
categoryId
active
confirmed
createdAt
updatedAt
```

Frequency:

```text
MONTHLY
YEARLY
UNKNOWN
```

olabilir.

---

# 27. Abonelik Dashboard

Örnek:

```text
AYLIK ABONELİKLER

ChatGPT          ₺750
Adobe            ₺600
Hosting          ₺350
Spotify          ₺100

Tahmini aylık sabit gider
₺1.800
```

Kullanıcı aboneliği pasif yapabilmelidir.

---

# 28. Aylık Dashboard

Ana dashboard seçilen ayı göstermelidir.

Örneğin:

```text
Ağustos 2026
```

Ana KPI kartları:

```text
Toplam Gelir
₺60.000

Toplam Harcama
₺32.840

Net Durum
₺27.160

İşlem Sayısı
87
```

---

# 29. Dashboard Karşılaştırması

Seçili ay bir önceki ay ile karşılaştırılmalıdır.

Örneğin:

```text
Toplam Harcama

₺32.840

Geçen aya göre
↑ %12,4
```

Kategori bazında da karşılaştırma yapılabilir.

Örneğin:

```text
Yemek
Temmuz: ₺3.200
Ağustos: ₺4.850
Değişim: +%51,5
```

---

# 30. Harcama Dağılımı

Dashboard'da kategori dağılımı grafik olarak gösterilmelidir.

Örneğin:

```text
Teknoloji       ₺8.420
Yemek           ₺5.200
Market          ₺4.100
Ulaşım          ₺2.850
Eğlence         ₺2.100
```

Donut/pie chart kullanılabilir.

Kategori renkleri tutarlı olmalıdır.

---

# 31. Zaman Grafiği

Son 6 veya 12 aylık harcama grafiği bulunmalıdır.

Örneğin:

```text
Mart      ₺22.450
Nisan     ₺31.200
Mayıs     ₺28.430
Haziran   ₺26.820
Temmuz    ₺28.450
Ağustos   ₺32.840
```

Kullanıcı:

```text
6 Ay
12 Ay
```

arasında geçiş yapabilmelidir.

---

# 32. Finans Geçmişi

Ayrı bir geçmiş ekranı olmalıdır.

Örneğin:

```text
2026

Ocak       ₺24.200
Şubat      ₺27.840
Mart       ₺22.450
Nisan      ₺31.200
Mayıs      ₺28.430
Haziran    ₺26.820
Temmuz     ₺28.450
Ağustos    ₺32.840
```

Bir aya tıklanarak o ayın detay dashboard'una gidilebilmelidir.

---

# 33. İşlemler Ekranı

Tüm işlemler tablo halinde gösterilmelidir.

Kolonlar:

```text
Tarih
Merchant
Açıklama
Tutar
Kategori
Taksit
Kaynak
```

Filtreler:

```text
Ay
Kategori
Merchant
İşlem türü
Kaynak
Taksitli işlemler
```

Arama yapılabilmelidir.

---

# 34. İşlem Düzenleme

Her işlem düzenlenebilir olmalıdır.

Kullanıcı:

- Merchant
- Tarih
- Tutar
- Kategori
- Alt kategori
- Not

alanlarını değiştirebilir.

PDF'den gelen orijinal açıklama mümkünse ayrıca korunmalıdır.

Örneğin:

```text
originalDescription
normalizedMerchant
```

ayrı tutulabilir.

---

# 35. Kategori Öğrenme

Kullanıcı kategori değiştirdiğinde sistem:

```text
Amazon işlemini Teknoloji / Donanım olarak değiştirdiniz.

Gelecekte Amazon işlemlerini de bu kategoriye atayalım mı?
```

sorusunu gösterebilir.

Kullanıcı kabul ederse MerchantRule oluşturulmalıdır.

---

# 36. Bütçe Sistemi

Bütçe sistemi opsiyonel olacaktır.

Kullanıcı bütçe belirlemek zorunda değildir.

Ayarlar veya Bütçe ekranından kategori bazlı limit tanımlayabilir:

```text
Yemek       ₺5.000
Market      ₺4.000
Teknoloji   ₺3.000
Eğlence     ₺2.000
```

Dashboard'da:

```text
Yemek
₺4.200 / ₺5.000
%84

Market
₺2.850 / ₺4.000
%71
```

gibi gösterilmelidir.

Limit aşılırsa:

```text
Bütçe aşıldı
```

uyarısı gösterilebilir.

Bütçe tanımlanmamış kategoriler için bütçe göstergesi gösterilmemelidir.

---

# 37. AI Katmanı

AI MVP için zorunlu değildir.

AI mimarisi provider bağımsız tasarlanmalıdır.

Örneğin:

```text
lib/ai/
    provider.ts
    ollama.ts
    openai.ts
```

gibi.

Interface:

```typescript
interface AIProvider {
  categorizeTransaction(...): Promise<...>
  generateFinancialSummary(...): Promise<...>
}
```

olabilir.

AI kapalıysa uygulama tamamen çalışmaya devam etmelidir.

---

# 38. AI Finansal Özet

AI provider aktif olduğunda kullanıcı:

```text
Bu ay finansal durumumu özetle.
```

dediğinde mevcut veriler üzerinden özet oluşturulabilir.

Örnek:

```text
Ağustos ayında toplam ₺32.840 harcadın.

En yüksek harcama kategorin Teknoloji oldu.

Geçen aya göre toplam harcamaların %12 arttı.

Yemek harcamalarında belirgin bir artış var.

Önümüzdeki ay kesinleşmiş taksit yükün ₺7.840.
```

AI finansal veriyi değiştiremez.

Sadece mevcut database verileri üzerinden yorum üretir.

---

# 39. AI Doğal Dil Sorgusu

İlerleyen versiyonda:

```text
Bu ay en çok nereye para harcadım?
```

```text
Son 3 ayda yemek harcamam ne kadar?
```

```text
Gelecek ay kaç TL taksit ödeyeceğim?
```

gibi sorular desteklenebilir.

Bu özellik MVP sonrası yapılmalıdır.

---

# 40. AI Güvenliği

AI'ya gereksiz tüm database gönderilmemelidir.

Sadece gerekli özet veriler gönderilmelidir.

Örneğin:

```text
monthlyTotals
categoryTotals
topMerchants
installmentTotals
subscriptionTotals
```

gibi aggregate veriler kullanılmalıdır.

Ham finansal verilerin tamamı AI provider'a gönderilmemelidir.

---

# 41. Settings

Ayarlar ekranında en az:

```text
Kategori Yönetimi
Bütçe Yönetimi
Merchant Kuralları
Abonelikler
AI Ayarları
Veri Yönetimi
```

olmalıdır.

---

# 42. Veri Yönetimi

Kullanıcı lokal database'in yedeğini alabilmelidir.

MVP sonrasında:

```text
Database Backup
Database Restore
```

eklenebilir.

Öncelikli olarak SQLite dosyasının kolayca yedeklenebilir olması yeterlidir.

---

# 43. Tasarım Sistemi

Arayüz modern bir SaaS dashboard hissinde olmalıdır ancak gereksiz görsel kalabalık olmamalıdır.

Önerilen yapı:

- Açık renkli ana arka plan
- Beyaz kartlar
- İnce border
- Orta radius
- Net typography
- Kompakt dashboard
- Tutarlı spacing
- Minimal shadow
- Responsive layout

Renk sistemi:

```text
Background
Surface
Border
Primary
Success
Warning
Danger
Muted
Text
```

şeklinde token bazlı olmalıdır.

Kategori renkleri de merkezi bir sistemden yönetilmelidir.

---

# 44. Layout

Desktop:

```text
┌──────────────┬──────────────────────────────┐
│              │                              │
│   Sidebar    │          Content             │
│              │                              │
│ Dashboard    │                              │
│ İşlemler     │                              │
│ Ekstreler    │                              │
│ Taksitler    │                              │
│ Abonelikler  │                              │
│ Bütçe        │                              │
│ Raporlar     │                              │
│              │                              │
│ Ayarlar      │                              │
└──────────────┴──────────────────────────────┘
```

Mobilde sidebar drawer'a dönüşmelidir.

---

# 45. Ana Navigasyon

Sidebar:

```text
Dashboard

Finans
  İşlemler
  Ekstreler
  Gelirler

Analiz
  Raporlar
  Kategoriler
  Abonelikler
  Taksitler

Planlama
  Bütçe

Ayarlar
```

---

# 46. Empty States

Uygulama ilk açıldığında hiç veri olmayabilir.

Dashboard boşsa:

```text
Henüz finansal veri yok.

İlk ekstresini yükleyerek başlayabilirsin.

[ Ekstre Yükle ]
```

gösterilmelidir.

Her ekran boş durumda kullanıcıya ne yapması gerektiğini anlatmalıdır.

---

# 47. Error Handling

Finansal uygulamada hata mesajları anlaşılır olmalıdır.

Örnek:

```text
PDF okunamadı.

Dosyanın geçerli bir Enpara ekstresi olduğundan emin olun.
```

veya:

```text
Bu ekstre zaten sisteme yüklenmiş.

Ağustos 2026 ekstresi daha önce içe aktarılmış.
```

Teknik stack trace kullanıcıya gösterilmemelidir.

Development ortamında console/log tutulabilir.

---

# 48. Validation

Tüm kullanıcı girdileri validate edilmelidir.

Özellikle:

- Tutar
- Tarih
- Kategori
- PDF
- Ekstre dönemi
- Taksit bilgisi

kontrol edilmelidir.

---

# 49. Duplicate Transaction

Ekstre duplicate kontrolünün ana kriteri:

```text
Statement period
```

olmalıdır.

Ancak transaction seviyesinde de güvenlik için duplicate fingerprint oluşturulabilir.

Örneğin:

```text
date
normalizedMerchant
amount
installmentCurrent
installmentTotal
```

birleştirilerek hash üretilebilir.

Bu hash aynı ekstre içerisinde duplicate transaction oluşmasını engellemeye yardımcı olabilir.

Ancak aynı merchant ve aynı tutardaki iki gerçek işlemin yanlışlıkla silinmemesine dikkat edilmelidir.

---

# 50. Finansal Hesaplama Kuralları

Tüm hesaplamalarda Decimal/precise numeric yaklaşımı kullanılmalıdır.

JavaScript floating point hatalarına güvenilmemelidir.

Örneğin:

```text
0.1 + 0.2 !== 0.3
```

gibi problemler oluşmamalıdır.

Para değerleri:

```text
decimal
```

veya integer kuruş mantığıyla tutulabilir.

Tercih edilen yöntem Prisma/SQLite uyumluluğu dikkate alınarak belirlenmelidir.

---

# 51. Dashboard Hesaplamaları

Toplam harcama:

```text
EXPENSE işlemlerinin toplamı
```

Toplam gelir:

```text
Income toplamı
+
gerekirse INCOME transaction toplamı
```

Net:

```text
Toplam gelir - toplam gider
```

Refund:

İade işlemleri gider toplamından düşülmelidir.

Aynı iadenin yanlışlıkla gelir olarak sayılmasına dikkat edilmelidir.

---

# 52. Ay Bazlı Hesaplama

Bir ayın harcaması belirlenirken işlem tarihi esas alınmalıdır.

Örneğin:

```text
15.08.2026
```

işlemi Ağustos 2026'ya aittir.

Ekstre yüklenme tarihi finansal ay hesabında kullanılmamalıdır.

---

# 53. Taksit Hesaplama Kuralı

Bir işlem:

```text
3/6
```

ise mevcut ayda yalnızca ilgili taksit harcaması gösterilmelidir.

Gelecek 3 taksit tahmini olarak oluşturulmalıdır.

Taksitlerin gelecekteki aylara aktarılması yeni bir gerçek transaction oluşturmamalıdır.

Böylece aynı harcamanın toplam harcamaya iki kez dahil edilmesi engellenir.

---

# 54. Abonelik Tespit Algoritması

İlk versiyonda basit ve güvenilir bir algoritma yeterlidir.

Aşağıdaki sinyaller değerlendirilebilir:

- Aynı normalizedMerchant
- Benzer tutar
- Yaklaşık 25-35 günlük tekrar
- En az 3 tekrar
- Benzer kategori

Örneğin:

```text
ChatGPT
15 Haziran
15 Temmuz
15 Ağustos
```

yüksek abonelik skoru alabilir.

Tutarın küçük farklılıkları kabul edilebilir.

---

# 55. Raporlar

Rapor ekranında:

```text
Aylık Harcama
Kategori Dağılımı
Aylık Karşılaştırma
En Çok Harcama Yapılan Merchant'lar
Abonelikler
Taksit Yükü
Gelir / Gider
```

gösterilebilir.

MVP'de PDF/Excel export zorunlu değildir.

---

# 56. Performans

Uygulama lokal çalışacağı için gereksiz backend complexity oluşturulmamalıdır.

1000-10.000 transaction seviyesinde rahat çalışması hedeflenmelidir.

Dashboard sorguları optimize edilmelidir.

Her render'da tüm transactionların tekrar işlenmesi önlenmelidir.

Aggregate sorgular tercih edilmelidir.

---

# 57. Logging

Development sırasında parser işlemleri loglanmalıdır.

Örneğin:

```text
[PDF] File loaded
[PDF] Statement period detected: 2026-08
[PDF] Transactions found: 87
[Categorization] 84 matched
[Categorization] 3 unresolved
[Import] Ready
```

Production benzeri kullanımda hassas finansal bilgiler loglara yazılmamalıdır.

---

# 58. Test Stratejisi

En kritik bölümler için unit test yazılmalıdır.

Özellikle:

## PDF parser

- Tarih parsing
- Türkçe para formatı
- Taksit parsing
- Transaction extraction
- Statement period extraction

## Categorization

- MerchantRule
- Known merchant
- Unknown merchant
- User override

## Installment

- 1/1
- 1/3
- 3/6
- 6/6
- Gelecek taksit hesabı

## Analytics

- Aylık toplam
- Kategori toplamı
- Gelir
- Gider
- Net
- Refund

## Duplicate

- Aynı ay tekrar yükleme
- Farklı ay yükleme

---

# 59. Geliştirme Sırası

Claude Code projeyi tek seferde karmaşık hale getirmemelidir.

Aşağıdaki sırayla ilerlenmelidir.

## Faz 1 — Proje kurulumu

- Next.js
- TypeScript
- Tailwind
- shadcn/ui
- Prisma
- SQLite
- temel layout
- navigation

Sonuç:

Uygulama localhost'ta açılmalı.

---

## Faz 2 — Database

- Prisma schema
- migrations
- seed kategoriler
- temel database servisleri

Test:

```text
Database oluşturulabiliyor.
Kategori eklenebiliyor.
Transaction eklenebiliyor.
```

---

## Faz 3 — Manuel İşlemler

Önce PDF olmadan:

- Manuel harcama
- Manuel gelir
- İşlem listesi
- İşlem düzenleme
- Kategori sistemi

oluşturulmalı.

Bu aşamada finansal veri modelinin doğru çalıştığı kanıtlanmalı.

---

## Faz 4 — PDF Parser

Enpara PDF parser oluşturulmalı.

PDF:

```text
PDF
 ↓
Text extraction
 ↓
Statement parser
 ↓
Transaction parser
 ↓
Validation
```

şeklinde çalışmalıdır.

Gerçek örnek PDF mevcut olmadığından parser mimarisi test edilebilir fixture'lar üzerinden oluşturulmalıdır.

---

## Faz 5 — Import Preview

- PDF upload
- analiz ekranı
- işlem listesi
- kategori önerileri
- kullanıcı düzenleme
- import onayı

---

## Faz 6 — Kategori Hafızası

- Merchant normalization
- MerchantRule
- user correction
- future auto-categorization

---

## Faz 7 — Dashboard

- KPI
- kategori dağılımı
- aylık karşılaştırma
- 6/12 ay grafik
- son işlemler

---

## Faz 8 — Taksit

- installment parsing
- future installments
- installment dashboard
- installment detail

---

## Faz 9 — Abonelik

- recurring transaction detection
- subscription list
- monthly subscription total
- confirmation

---

## Faz 10 — Budget

- budget CRUD
- category limits
- budget progress
- exceeded state

---

## Faz 11 — Reports

- historical dashboard
- reports
- category trends
- merchant analysis

---

## Faz 12 — AI

AI ancak bütün temel sistem stabil olduktan sonra eklenmelidir.

İlk AI özelliği:

```text
Aylık Finansal Özet
```

Sonra:

```text
Doğal Dil Finansal Sorgular
```

---

# 60. MVP Definition of Done

MVP tamamlandı sayılması için kullanıcı:

1. Uygulamayı localhost'ta açabilmeli.
2. Enpara PDF'si yükleyebilmeli.
3. PDF'den işlemler çıkarılabilmeli.
4. Ekstre dönemi otomatik belirlenmeli.
5. Aynı ayın ekstresi ikinci kez yüklenememeli.
6. İşlemler otomatik kategorize edilebilmeli.
7. Kullanıcı kategori değiştirebilmeli.
8. Kategori değişiklikleri gelecekte öğrenilebilmeli.
9. Manuel işlem eklenebilmeli.
10. Manuel gelir eklenebilmeli.
11. Taksitler takip edilebilmeli.
12. Gelecek taksitler görülebilmeli.
13. Muhtemel abonelikler görülebilmeli.
14. Aylık toplam harcama görülebilmeli.
15. Gelir/gider/net hesaplanabilmeli.
16. Kategori dağılımı görülebilmeli.
17. Önceki ayla karşılaştırma yapılabilmeli.
18. Son 6/12 ay görülebilmeli.
19. İşlemler filtrelenebilmeli.
20. Uygulama lokal SQLite database kullanmalı.

---

# 61. MVP Dışında Tutulacaklar

İlk versiyonda şunları yapma:

- Kullanıcı kayıt sistemi
- Login
- Multi-user
- Cloud database
- SaaS
- Ödeme sistemi
- Mobil uygulama
- Banka API entegrasyonu
- Otomatik banka bağlantısı
- WhatsApp entegrasyonu
- E-posta entegrasyonu
- Karmaşık OCR sistemi
- Ücretli AI API zorunluluğu
- Gelişmiş yatırım takibi
- Kripto takip
- Hisse senedi takip
- Çoklu para birimi için karmaşık dönüşüm sistemi

Bunlar ileride değerlendirilebilir.

---

# 62. Kod Kalitesi

Kod:

- TypeScript strict mode ile yazılmalı.
- `any` gereksiz yere kullanılmamalı.
- Business logic UI componentlerine gömülmemeli.
- Database erişimi merkezi servislerden yapılmalı.
- PDF parsing ayrı modül olmalı.
- Categorization ayrı modül olmalı.
- Analytics ayrı modül olmalı.
- AI ayrı abstraction olarak tutulmalı.
- Tekrarlanan kodlar helper/service haline getirilmeli.

---

# 63. Hata Yönetimi

Her kritik işlem try/catch ve anlamlı error handling içermelidir.

Özellikle:

```text
PDF upload
PDF parsing
Database insert
Statement import
Category update
Installment calculation
```

hataları düzgün yakalanmalıdır.

Kullanıcıya teknik hata yerine anlaşılır mesaj gösterilmelidir.

---

# 64. Responsive Design

Uygulama öncelikle desktop kullanımına optimize edilebilir.

Ancak tüm ekranlar responsive olmalıdır.

Mobil:

- Sidebar drawer
- Kartların alt alta dizilmesi
- Tablo yerine responsive transaction listesi
- Grafiklerin küçülmesi

desteklenmelidir.

---

# 65. UX Detayları

Kullanıcı herhangi bir işlem yaptıktan sonra sonucu anlamalıdır.

Örneğin:

```text
✓ Ekstre başarıyla içe aktarıldı.

87 işlem eklendi.
84 işlem otomatik kategorize edildi.
3 işlem inceleme bekliyor.
```

Kategori değiştirdiğinde:

```text
✓ Kategori güncellendi.
```

Merchant rule oluşturduğunda:

```text
✓ Amazon için kategori kuralı kaydedildi.
```

gibi feedback gösterilmelidir.

---

# 66. Loading State

Her async işlem için loading state bulunmalıdır.

Özellikle PDF analizinde kullanıcı boş ekranda beklememelidir.

Analiz aşamaları:

```text
PDF okunuyor
Ekstre dönemi belirleniyor
İşlemler çıkarılıyor
İşlemler kategorize ediliyor
Taksitler analiz ediliyor
Sonuçlar hazırlanıyor
```

şeklinde gösterilmelidir.

---

# 67. Önemli Finansal Kural

Uygulama hiçbir zaman kullanıcı adına finansal işlem gerçekleştirmeyecektir.

Sadece:

```text
okuma
analiz
kategorileme
takip
raporlama
```

yapar.

Banka hesabına veya kredi kartına işlem göndermez.

---

# 68. Gelecekte Genişletilebilir Mimari

Şu an yalnızca Enpara desteklenecek.

Ancak parser interface'i:

```typescript
interface StatementParser {
  canParse(input): boolean
  parse(input): Promise<ParsedStatement>
}
```

gibi tasarlanmalıdır.

İleride:

```text
EnparaParser
GarantiParser
YapiKrediParser
IsBankasiParser
```

eklenebilecek şekilde yapılandırılabilir.

Ancak MVP'de sadece Enpara implementasyonu yapılmalıdır.

---

# 69. İlk Kullanım Deneyimi

Uygulama ilk açıldığında kullanıcıyı boş dashboard ile bırakma.

Eğer database'de hiç Statement yoksa:

```text
Finans takip sistemine hoş geldin.

Henüz hiçbir ekstre yüklenmemiş.

İlk Enpara ekstresini yükleyerek başlayabilirsin.

[ Ekstre Yükle ]
```

göster.

İlk ekstre başarıyla içe aktarıldığında kullanıcı dashboard'a yönlendirilebilir.

---

# 70. Claude Code Çalışma Kuralları

Bu proje Claude Code tarafından geliştirilirken aşağıdaki kurallara uyulmalıdır.

## Kural 1

Projeyi tek seferde tamamen yazmaya çalışma.

Önce mevcut repository'yi incele.

Sonra implementation planı oluştur.

## Kural 2

Her fazı tamamladıktan sonra:

- typecheck
- lint
- test
- build

çalıştır.

## Kural 3

Bir özellik çalışmadan sonraki özelliğe geçme.

## Kural 4

Mevcut çalışan özellikleri bozma.

## Kural 5

Database schema değişikliklerinde migration kullan.

## Kural 6

Mock data yalnızca UI geliştirmek için kullanılabilir.

Final sistemde gerçek database kullanılmalıdır.

## Kural 7

PDF parser konusunda varsayım yapma.

Gerçek Enpara PDF örneği yoksa parser'ın varsayımsal formatını açıkça belirt ve fixture tabanlı test altyapısı oluştur.

## Kural 8

Finansal hesaplamalarda precision hatası oluşturma.

## Kural 9

AI'ı temel sisteme zorunlu dependency yapma.

## Kural 10

Her önemli business rule için test yaz.

---

# 71. Claude Code İlk Görev

Bu dosya okunduktan sonra hemen kod yazmaya başlama.

İlk olarak:

1. Gereksinimleri analiz et.
2. Teknik mimariyi çıkar.
3. Database ER yapısını planla.
4. Klasör yapısını oluştur.
5. Kullanılacak paketleri belirle.
6. PDF parser yaklaşımını belirle.
7. Uygulama ekranlarını listele.
8. Geliştirme fazlarını sırala.
9. Olası teknik riskleri belirt.
10. Sonra implementasyona başla.

İlk cevapta bana:

```text
PROJECT ANALYSIS
ARCHITECTURE
DATABASE DESIGN
SCREEN STRUCTURE
IMPLEMENTATION PLAN
RISKS
```

başlıkları altında kısa ama teknik bir plan sun.

Ben onayladıktan sonra Faz 1'e geç.

Ancak kullanıcı onayı beklemeden bağımsız ve düşük riskli setup işlemlerine başlanabilecekse bunları yapabilirsin.

---

# 72. Öncelik Sırası

Özellik öncelikleri:

```text
P0
Database
Manuel transaction
Manuel income
PDF parsing
Statement import
Duplicate protection

P1
Categorization
Merchant normalization
Merchant memory
Dashboard
Monthly analytics

P2
Installments
Subscriptions
Budget
Reports

P3
AI summary
AI natural language queries
Advanced analytics
```

P0 özellikler tamamlanmadan P2/P3 özelliklerine geçme.

---

# 73. Başarı Kriteri

Bu uygulamanın başarısı görsel olarak çok fazla özelliğe sahip olması değildir.

Temel başarı kriteri:

> Kullanıcı her ay Enpara ekstresini yüklediğinde, geçmiş ayları bozmadan işlemleri doğru şekilde sisteme aktarabilmesi ve birkaç saniye içinde o ayın finansal durumunu anlayabilmesi.

Özellikle şu üç alan yüksek doğrulukta çalışmalıdır:

```text
PDF → Transaction
Transaction → Category
Transaction → Monthly Analytics
```

Bunlar uygulamanın çekirdeğidir.

---

# 74. Son Hedef

Ortaya çıkacak uygulama şu hissi vermelidir:

> “Her ay ekstreyi yüklediğimde finansal durumumu benim yerime düzenleyen kişisel finans panelim.”

Uygulama karmaşık bir muhasebe programı değil;

**kişisel harcama hafızası + aylık finans dashboard'u + taksit/abonelik takip sistemi**

olarak konumlandırılmalıdır.