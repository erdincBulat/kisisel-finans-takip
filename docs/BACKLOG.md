# Backlog — Denetim Bulguları (2026-08-29)

Bu dosya, uygulamanın genel bir denetiminden (kod kalitesi + spec uyumluluğu + gerçek veriyle canlı tarayıcı taraması) çıkan, henüz düzeltilmemiş bulguları kaydeder. Amaç: bir sonraki oturumda sıfırdan keşfetmek yerine buradan devam edebilmek. Öncelik sırası kabaca yukarıdan aşağıya.

**Zaten düzeltilenler** (aynı denetimden, aynı gün): Top Merchants'ın banka ücretlerini göstermesi, abonelik "Bu Ay" hesabının taksitli işlem sızıntısına açık olması, `syncSubscriptions`'ın sıralı (N+1) yazması, TL string formatlamasının 3 yerde kopyalanması, `addKurus`/`tlToKurus` ölü kodu — bkz. git geçmişi, `docs/PHASES.md`'ye ayrıca not düşülmedi (küçük çaplı düzeltmeler, faz değil).

---

## Eksik özellikler (spec'te var, uygulamada yok)

### 1. `/settings` hâlâ Faz 1 placeholder'ı
`app/settings/page.tsx` sadece `PlaceholderPage` render ediyor. Spec §41 gerçek bir hub istiyor: Kategori Yönetimi / Bütçe Yönetimi / Merchant Kuralları / Abonelikler / AI Ayarları / Veri Yönetimi kısayolları. Kategoriler, Bütçe, Abonelikler artık gerçek sayfalar (Faz 3/10/9) ama Ayarlar'dan hiçbirine link yok. `Setting` Prisma modeli + `lib/db/setting.service.ts` (`getSetting`/`setSetting`/`getAll`) zaten var ama hiçbir çağıranı yok — muhtemelen bu sayfa için önceden hazırlanmış altyapı (Faz 2'de tüm şemayla birlikte eklenmiş).

### 2. Merchant Kuralları (`MerchantRule`) için hiçbir yönetim ekranı yok
Kural sadece `/transactions` düzenleme diyaloğundaki "Gelecekte de uygula?" akışıyla dolaylı olarak oluşuyor (`lib/merchants/merchant-rule.service.ts`'in `upsertMerchantRule`'u). Var olan bir kuralı listeleyip görmenin, düzeltmenin ya da silmenin hiçbir yolu yok — yanlış bir kural oluşursa kullanıcı fark edemez/temizleyemez. Spec §41 bunu Ayarlar'ın alt maddelerinden biri olarak istiyor.

### 3. İşlemler ekranı (`/transactions`) spec §33'ün istediği kolon/filtre setinin tamamını karşılamıyor
- `components/transactions/transactions-table.tsx`: ayrı bir **Merchant** kolonu yok, sadece `description` (açıklama) gösteriliyor — `normalizedMerchant` alanı DB'de var ama tabloda kullanılmıyor.
- `components/transactions/transactions-filters.tsx`: **Kaynak** (Manuel/Ekstre) filtresi arayüzde yok — `lib/db/transaction.service.ts`'in `TransactionFilters`'ı `source` parametresini zaten destekliyor, sadece bir `<Select>` eklenmemiş. Merchant'a özel bir filtre de yok (yalnızca serbest metin arama var, "Merchant veya açıklama ara").

### 4. Veri Yönetimi (yedekleme) için uygulama içinde hiçbir şey yok
Spec §42'nin barı düşük ("SQLite dosyasının kolayca yedeklenebilir olması yeterli") ama uygulama içinde `data/finance.db`'nin nerede durduğuna dair tek bir not bile yok. En azından Ayarlar'da bir "veri konumu" bilgisi + belki "dosyayı indir" kısayolu düşünülebilir.

### 5. Boş durum (empty state) mesajları tutarsız
Dashboard, Abonelikler, Taksitler, Bütçe'de rehberli "henüz veri yok, şunu yapın" mesajı var (spec §46 "Her ekran" diyor; Bütçe'ninki "Henüz bütçe tanımlanmadı. Bir kategori için aylık limit belirleyerek başlayın."). **Raporlar, Geçmiş ve Kategoriler'de sayfa seviyesinde hiç yok** (doğrulandı — `app/reports/page.tsx`, `app/history/page.tsx`, `app/categories/page.tsx`'te bu metinlerden hiçbiri geçmiyor) — hiç veri olmadan bu sayfalara girildiğinde grafikler/tablolar sessizce boş/sıfır görünüyor, kullanıcıya "önce şunu yap" demiyor.

### 6. Yanlış PDF yüklenirse geri alma yolu yok
Ne kredi kartı ekstresi (`Statement`) ne hesap özeti (`AccountStatement`) için bir silme özelliği var (`deleteStatement`/`deleteAccountStatement` hiçbir yerde tanımlı değil). Duplicate-guard (`@@unique([year, month])`) aynı dönemi tekrar yüklemeyi de engellediği için, yanlış ay/PDF yüklenirse kullanıcı veritabanına elle müdahale etmeden düzeltemiyor.

---

## Gözlemler / ürün fırsatları (hata değil, gerçek verinizde fark ettiklerim)

### 7. Hesap özetinden gelen 29 gelir kaydının tamamı kategorisiz
`/income` tablosunda "Kategori" kolonu her satırda "-". İşlemler'deki gibi toplu kategori atama (`bulk-category-bar.tsx` benzeri) Gelirler'de yok — tek tek düzenlemek gerekiyor.

### 8. Abonelik "Sıradaki Ödeme" tarihleri sessizce geçmişe düşebiliyor
Örn. Türk Telekom'un `nextExpectedDate`'i 16.08.2026 idi, bugünün tarihi 29.08.2026 — tarih geçmiş ama arayüzde hiçbir "gecikti/beklemede" işareti yok. `syncSubscriptions` yeni bir gerçek işlem bulana kadar bu tarih güncellenmiyor.

### 9. Kategori isim çakışması: "İnternet Alışverişi" vs "Ev İnternet Alışverişi"
Biri ana kategori (online alışveriş sitesi harcamaları için), diğeri Ev'in altında bir alt kategori (ev internet faturası için). İsimler çok benzer, kategorize ederken kullanıcı yanlışlıkla birini diğeriyle karıştırabilir. İsimlerden birini daha ayırt edici yapmak (örn. "Ev İnterneti Faturası") düşünülebilir.

### 10. Henüz hiç bütçe girilmemiş
Faz 10'da eklenen özellik şu an hiç kullanılmıyor — kategori limitleri girilirse hem `/budgets` hem (varsa ileride eklenecek) ilgili uyarılar devreye girer.

---

**Nasıl devam edilir:** Bu dosyadaki her madde bağımsız, küçük-orta ölçekli bir iş — birini seçip "şunu yap" demek yeterli, sırayla gitmek zorunlu değil. Bir madde çözülünce bu dosyadan silinip (gerekiyorsa) `docs/PHASES.md`'ye kısa bir not olarak taşınabilir.
