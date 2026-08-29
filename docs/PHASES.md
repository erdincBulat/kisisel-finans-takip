# Geliştirme Fazları — Detaylı Durum

Sıralama `PROJECT_SPEC.md` §59/§72 (P0→P3 önceliği) ve onaylanmış mimari planın IMPLEMENTATION PLAN bölümüne dayanır. Her faz bitmeden bir sonrakine geçilmez (Kural 3); her fazdan sonra typecheck/lint/test/build çalıştırılır (Kural 2).

Referans örnek ekstre: [`05.08.2026 tarihli Enpara.com Kredi Kartı ekstreniz.pdf`](./05.08.2026%20tarihli%20Enpara.com%20Kredi%20Kart%C4%B1%20ekstreniz.pdf) — Faz 4'te parser fixture'larının temel kaynağı.

---

## ✅ Faz 1 — Proje Kurulumu (tamamlandı)

- [x] Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- [x] shadcn/ui kurulumu (`components.json`, `lib/utils.ts`, `button/card/separator/badge/sheet`)
- [x] Tasarım tokenleri: Background/Surface/Border/Primary/Success/Warning/Danger/Muted/Text (`app/globals.css`)
- [x] Temel layout: `components/layout/{app-shell,sidebar,mobile-nav,nav-links,nav-config,placeholder-page}.tsx`
- [x] Sidebar navigasyonu (spec §45: Dashboard / Finans / Analiz / Planlama / Ayarlar) + mobil drawer (Sheet)
- [x] Tüm route'lar için placeholder sayfa (`app/**/page.tsx`)

**Sonuç (doğrulandı):** `npm run dev` ile localhost:3000 açılıyor, `/` → `/dashboard`'a yönlendiriyor, sidebar aktif link vurgusu ve mobil hamburger menü çalışıyor (Playwright ile ekran görüntüsü alınarak test edildi). `typecheck` / `lint` / `test` / `build` yeşil.

---

## ✅ Faz 2 — Database (tamamlandı)

- [x] `prisma/schema.prisma` — tüm modeller: `Category`, `Statement`, `Transaction`, `MerchantRule`, `Installment`, `Subscription`, `Budget`, `Income`, `Setting`
- [x] İlk migration uygulandı → `data/finance.db`
- [x] `prisma/seed.ts` — varsayılan kategori ağacı (spec §9, 35 kayıt: 7 ana + 25 alt gider kategorisi + 3 gelir kategorisi)
- [x] Prisma 7 driver adapter kurulumu (`@prisma/adapter-better-sqlite3`, `prisma7.config.ts`, `lib/db/client.ts`)
- [x] `lib/db/category.service.ts` — CRUD + silme koruması (spec §9: işlem/alt kategori/başka kayıt varsa engelle)
- [x] `lib/db/transaction.service.ts` — CRUD, filtreli liste, `computeFingerprint` (spec §49 duplicate koruması)
- [x] `lib/db/income.service.ts` — CRUD, filtreli liste
- [x] `lib/db/setting.service.ts` — get/set/getAll
- [x] `tests/fingerprint.test.ts` — fingerprint determinizmi, case-insensitive merchant, taksit farkı ayrımı
- [x] Gerçek DB üzerinde uçtan uca smoke test (create/list/delete + kategori silme koruması) — DB temiz bırakıldı

`lib/db/statement.service.ts` bilinçli olarak ertelendi — Faz 4/5'te PDF import akışı yazılırken eklenecek (henüz onu kullanan bir akış yok).

**Sonuç (doğrulandı, spec §59):** "Database oluşturulabiliyor / Kategori eklenebiliyor / Transaction eklenebiliyor" — `typecheck`/`lint`/`test`/`build` yeşil, smoke test gerçek `data/finance.db` üzerinde çalıştı.

---

## ✅ Faz 3 — Manuel İşlemler (tamamlandı)

PDF olmadan, finansal veri modelinin doğruluğu kanıtlandı:

- [x] `lib/validation/` — zod şemaları (`transaction.schema.ts`, `income.schema.ts`, `category.schema.ts`, `money-field.ts`)
- [x] `lib/action-state.ts` + `components/shared/use-action-toast.ts` + `components/shared/confirm-delete-button.tsx` — server action / toast / silme onayı için paylaşılan altyapı
- [x] `/transactions` — tablo, filtreler (ay/kategori/tür/taksitli + arama), manuel işlem ekleme/düzenleme dialog'u, silme
- [x] `/income` — manuel gelir formu + liste + düzenleme/silme
- [x] `/categories` — ana/alt kategori CRUD, renk seçici, gelir/gider ayrımı, işlem içeren kategori için silme koruması (spec §9 uyarısı, gerçek DB'de test edildi)
- [x] Tasarım tokenlerine eksik olan `--danger` eklendi (spec §43'ün tam seti: Background/Surface/Border/Primary/Success/Warning/Danger/Muted/Text)
- [x] Base UI `Select` bileşeninin `items` prop'u olmadan seçilen değerin etiket yerine ham value/ID gösterdiği bulundu ve tüm select'lerde düzeltildi
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı: kategori oluştur/düzenle/sil, işlem oluştur/düzenle/filtrele/sil, gelir oluştur/düzenle/sil — DB temiz bırakıldı

**Bilinen küçük not:** Düzenleme formunu başarıyla kaydedince konsolda zararsız bir Base UI dev-uyarısı görülüyor (React 19'un başarılı action sonrası formu resetleme davranışı ile Base UI `Input`/`Select`'in dahili state'i arasında bir etkileşim). Fonksiyonel bir etkisi yok, production build'de görünmüyor; ileride tüm form alanları controlled hale getirilirse ortadan kalkar.

---

## ✅ Faz 4 — PDF Parser (tamamlandı)

- [x] `lib/pdf/extract-text.ts` — `pdf-parse` v2 (`PDFParse.getText()`) sarmalayıcı
- [x] `lib/pdf/parse-statement.ts` — ekstre tarihi/bir sonraki ekstre tarihi/mutabakat toplamları/periodStart çıkarımı, "GG/AA/YYYY ile başlamıyor" kuralıyla özet/başlık/footer satırlarının filtrelenmesi
- [x] `lib/pdf/normalize-transaction.ts` — satır regex'i, taksit token ayrıştırma, PAYMENT/REFUND/EXPENSE sınıflandırması, banka ücreti (faiz/KKDF/BSMV) tespiti
- [x] `lib/pdf/validate.ts` — header mutabakat kontrolü (harcama/ücret/ödeme toplamları), duplicate fingerprint uyarısı
- [x] `lib/pdf/types.ts` — `StatementParser`, `ParsedStatement`, `ParsedTransaction`
- [x] `lib/pdf/parsers/enpara-parser.ts` — `canParse` + `parse`
- [x] `tests/parser/fixtures/enpara-2026-08-real.txt` — **gerçek** PDF'in birebir `pdf-parse` çıktısı
- [x] `tests/parser/fixtures/enpara-hypothetical-installment.txt` — **varsayımsal**, açıkça işaretli taksit fixture'ı + `fixtures/README.md` açıklaması (Kural 7)
- [x] 42 test (unit + gerçek PDF dosyası üzerinden uçtan uca entegrasyon testi) — hepsi yeşil

**Gerçek PDF ile doğrulanan önemli sonuçlar:**
- **37 işlemin tamamı** doğru ayrıştırıldı (2 sayfaya bölünmüş, sayfa başlığı tekrar eden bir ekstrede kayıp/fazla işlem yok).
- **Mutabakat kontrolü ilk denemede birebir tuttu**: çıkarılan işlemlerin toplamı (₺16.450,09) ekstre header'ındaki "Harcamalar ve yansıyan taksitler" ile, banka ücretleri toplamı (₺362,55) "Faiz, vergiler, ücretler" ile, ödeme toplamı (₺15.000,00) "Ödemeler" ile kuruşu kuruşuna eşleşti.
- **`periodStart` mimari plandaki tahminden (statementDate − 1 ay + 1 gün) daha basit ve daha doğru çıktı**: gerçek veri gösterdi ki `periodStart = min(transaction.date)` doğrudan doğru sonucu veriyor (2026-07-05), ayrı bir tarih-matematiği tahmine gerek yok. Sadece hiç işlem bulunamazsa (bozuk PDF) kaba bir yedek hesap kullanılıyor.
- Ödeme kuruluşu önekleri (`IYZICO/`, `PAYTR ÖD/`, `HEPSIPAY/`, `GOOGLE *`) ve iç kısa çizgili açıklamalar (`Motorlu Taşıtlar Vergisi - Tahsilatı`, `Ödeme - Enpara.com Cep Şubesi`) doğru ayrıştırıldı; `/` içeren ama taksit olmayan merchant adları (`BIM A.S. / L335/ KUTSAL`) yanlış pozitif üretmedi.

**Hâlâ doğrulanamamış (Faz 4 sırasında):** Taksitli işlemlerin gerçek metin formatı (bkz. `fixtures/README.md`) — bu ekstrede hiç taksitli işlem yoktu.

**Sonradan not (Faz 6 sırasında çözüldü):** Kullanıcı 6 aylık gerçek ekstre serisi (Mart–Ağustos 2026) yükleyince ilk gerçek taksitli işlem ortaya çıktı — gerçek format yukarıdaki varsayımdan farklı (`"TRENDYOL.COM ISTANBUL TR (849,00 TL) 2/3 283,00 TL"` — toplam fiyat parantez içinde, taksit öbeği taksit başına tutardan hemen önce), ama `extractInstallmentToken` **hiçbir kod değişikliği gerekmeden** doğru ayrıştırdı (yapısal "sondaki N/M" kuralı sayesinde). Detay ve yeni gerçek fixture için `tests/parser/fixtures/README.md`.

---

## ✅ Faz 5 — Import Preview (tamamlandı)

- [x] `lib/db/statement.service.ts` — `getStatementByPeriod`, `listStatements`, `createStatementWithTransactions` (Statement + Transaction'lar tek `$transaction` içinde, spec §8/§49) — Faz 2'de ertelenmişti, burada eklendi
- [x] `/statements` — ekstre listesi (dönem/dosya/işlem sayısı/toplam/durum/yüklenme tarihi, dönem linki `/transactions?month=` filtresine gider) + drag & drop / dosya seçim alanı (spec §13) + boş durum (spec §46)
- [x] `/statements/import` — aşama tabanlı analiz animasyonu (spec §14/§66: 6 sabit aşama, sahte yüzde yok) → düzenlenebilir önizleme tablosu (özet kartları, doğrulama uyarıları, satır bazlı kategori seçimi) → "Ekstreyi Kaydet"
- [x] Duplicate koruması: Statement `year+month` (analiz anında VE kaydetme anında iki kez kontrol edilir — TOCTOU'ya karşı) + her transaction'a fingerprint (spec §8/§49 tam metniyle: "Ağustos 2026 ekstresi zaten yüklenmiş...")
- [x] `lib/statement-import/pending-upload.ts` — `/statements`'ta bırakılan dosyayı client-side navigasyonla `/statements/import`'a taşıyan bellek-içi tek kullanımlık depo (Next.js App Router client geçişleri JS runtime'ı sıfırlamadığı için güvenli); `/statements/import`'a doğrudan URL ile gelinirse (bekleyen dosya yoksa) sayfa kendi upload alanını gösterir
- [x] Kategori ataması tamamen manuel bırakıldı (Faz 6'nın MerchantRule/engine'i henüz yok) — her satır "Kategori seçilmedi" ile başlar, `PAYMENT` tipi satırlar (kart borç ödemesi) kategori istemez ve "Kategori bekleyen" sayacına dahil edilmez; kaydetme kategori zorunluluğu OLMADAN çalışır (spec §19 sadece hatırlatma istiyor, engel değil)
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı: PDF yükle → 37 işlem doğru ayrıştı → kategori seç → kaydet → `/statements` listesinde doğru dönem/toplam/durum göründü → `/statements/import`'a doğrudan gidiş boş-durum fallback'i gösterdi → aynı PDF'i tekrar yükleme spec'teki birebir mesajla ("Bu ekstre zaten sisteme yüklenmiş. Ağustos 2026 ekstresi daha önce içe aktarılmış.") engellendi → konsolda hiç hata yoktu — doğrulama sonrası test verisi DB'den silindi, DB temiz bırakıldı

**Önemli bulgu — Turbopack + pdf-parse:** Faz 4'ün testleri `EnparaParser.parse()`'ı doğrudan Vitest/Node içinde çağırdığı için hiç yakalanmamış bir prod-runtime hatası buradaki uçtan uca doğrulamada ortaya çıktı: `analyzeStatementAction` içinden çağrıldığında (yani gerçek Next.js/Turbopack server runtime'ında) pdf-parse'ın sardığı `pdfjs-dist`, worker dosyasını (`pdf.worker.mjs`) Turbopack'in bundle edip chunk'a gömdüğü sanal bir yolda arayıp "Setting up fake worker failed" ile patlıyordu. Çözüm: `next.config.ts`'e `serverExternalPackages: ["pdf-parse", "pdfjs-dist"]` eklendi — bu paketler artık bundle edilmeden native Node `require` ile yükleniyor. Bu, "typecheck/lint/test/build yeşil ama UI'da gerçekten dene" kuralının (spec §70 Kural 2, CLAUDE.md) tam olarak neden var olduğunun kanıtı: hiçbir otomatik kontrol bu hatayı yakalamadı, sadece gerçek tarayıcıda PDF yükleyince ortaya çıktı.

---

## ✅ Faz 6 — Kategori Hafızası (tamamlandı)

- [x] `lib/merchants/text.ts` — `trLower` (Türkçe locale-aware lowercasing) + `matchFold` (eşleştirme için Türkçe harfleri ASCII'ye katlar)
- [x] `lib/merchants/normalize.ts` — `stripKnownPrefixes` (`GOOGLE *`, `IYZICO/`, `PAYTR ÖD/`, `HEPSIPAY/` — gerçek ekstreden çıkarılan önekler) + `normalizeMerchant`
- [x] `lib/merchants/known-merchants.ts` — statik, elle küratörlüğü yapılmış bilinen merchant tablosu (isim + opsiyonel kategori önerisi; Amazon/Trendyol/Hepsiburada gibi geniş kapsamlı e-ticaret siteleri kasıtlı olarak kategorisiz)
- [x] `lib/merchants/merchant-rule.service.ts` — `listMerchantRules`, `upsertMerchantRule`
- [x] `lib/categorization/pattern-rules.ts` — geniş anahtar kelime kuralları (market/yemek/ulaşım/fatura/vergi/hosting + banka ücreti bayrağı → Bankacılık)
- [x] `lib/categorization/engine.ts` — öncelik zinciri (spec §12): MerchantRule > bilinen merchant > pattern matching > (AI adımı kasıtlı atlandı, `lib/ai/` Faz 12'de gelecek) > `null` ("Kategori seçilmedi"); `suggestCategoriesForTransactions` toplu (N+1 sorgu değil) çalışır
- [x] `analyzeStatementAction` (Faz 5) artık her satır için öneri hesaplıyor — önizleme tablosu `null` yerine gerçek önerilerle açılıyor, kullanıcı istediği gibi düzeltebiliyor
- [x] "Gelecekte de uygula?" akışı: `/transactions` düzenleme dialog'unda kategori değiştirilip kaydedilince sonner toast'ı soru olarak sorar (spec §11/§35 birebir metin), "Evet, uygula" → `createMerchantRuleAction` → `MerchantRule` oluşturur/günceller
- [x] Manuel/ekstre işlem oluşturma artık `normalizedMerchant`'ı `normalizeMerchant()` ile hesaplıyor (önceden açıklamayla aynıydı — bkz. Faz 5 notu)
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı: gerçek PDF yüklendi → **28/36 kategorilendirilebilir işlem otomatik doğru kategoriye atandı** (BIM/Market, Claude by Anth/Teknoloji-AI, Motorlu Taşıtlar Vergisi/Vergi, ENERJISA ELEKTRI/Fatura, KARADENİZ BÜFE/Yemek, banka ücretleri/Bankacılık, vb.) — kalan 8'i (AYŞE DEMİR gibi kişi adları, TRENDYOL.COM gibi geniş e-ticaret) kasıtlı olarak "Kategori seçilmedi" bıraktı (yanlış pozitif üretmedi) → ekstre kaydedildi → `/transactions`'ta bir işlemin kategorisi değiştirilip kaydedildi → "Gelecekte de uygula?" toast'ı doğru metinle çıktı → "Evet, uygula" → `MerchantRule` DB'de doğru oluştu → doğrudan `suggestCategory()` çağrısı bu kuralı `source: "MERCHANT_RULE"` ile buldu (öncelik zincirinin gerçek DB verisiyle çalıştığı doğrulandı) — test verisi (statement + transactions + merchant rule) temizlendi, DB temiz bırakıldı

**Geliştirme sırasında bulunup düzeltilen gerçek hatalar (kendi testlerim sayesinde yakalandı):**
1. **Türkçe I/İ büyük-küçük harf sorunu, iki farklı biçimde:** (a) `.toLowerCase()` (locale-bağımsız) Türkçe büyük İ'yi tek bir "i" değil "i" + ayrı birleşen nokta işaretine (U+0307) çeviriyor, bu da alt dize eşleşmesini sessizce bozuyor (`"Tİ CARET".toLowerCase()` "ticaret"i içermiyor) — `trLower` (`.toLocaleLowerCase("tr")`) bunu çözüyor. (b) Ama gerçek ekstre metninde Türkçe karakter kullanımı TUTARSIZ: aynı belgede "ELEKTRI" düz ASCII I ile, "TİCARET" ise düzgün Türkçe İ ile geçiyor (bkz. `tests/parser/fixtures/enpara-2026-08-real.txt`). `trLower` tek başına ASCII "I"yı Türkçe kuralına göre "ı" (noktasız) yapıyor, "elektrik" anahtar kelimesiyle eşleşmiyor. Çözüm: `matchFold` — `trLower` sonrası Türkçe harfleri (ı/ş/ç/ğ/ö/ü) ASCII muadillerine katlıyor, SADECE eşleştirme için kullanılıyor (görüntülenen adları bozmuyor). Bu iki hata da ilk yazdığım pattern-rules testleriyle (gerçek ekstre verisiyle) yakalandı, varsayımsal veriyle yazılsaydı fark edilmezdi.
2. **"büfe"/"bufe" yanlış kategoriye (Market) eklenmişti**, doğrusu Yemek — yine gerçek veri testiyle (`KARADENİZ BÜFE`) yakalandı.
3. **`/transactions` düzenleme dialog'unda "Gelecekte de uygula?" hiç tetiklenmiyordu** — `updateTransactionAction` içindeki `revalidatePath("/transactions")`, dialog hâlâ açıkken üst Server Component'i (TransactionsTable) YENİ kategoriyle yeniden render edip `transaction` prop'unu güncelliyordu; başarı callback'i çalıştığında "eski kategori" ile karşılaştırma yaptığım prop artık zaten YENİ değeri taşıyordu (kendisiyle karşılaştırıp hep "değişmedi" sonucu çıkıyordu). Çözüm: dialog açılış anındaki transaction'ı bir `useRef`'e alıp karşılaştırmayı ona karşı yapmak — prop'un sonradan revalidate ile değişmesinden etkilenmiyor. Bu, Server Actions + `revalidatePath` + açık kalan client dialog kombinasyonunda genel olarak dikkat edilmesi gereken bir kalıp (bkz. `CLAUDE.md`).

**Sonradan not — kullanıcının gerçek 6 aylık verisiyle (Mart–Ağustos 2026) canlı içe aktarma:** Kullanıcı `docs/` altına 6 aylık gerçek ekstre ekleyip hepsinin içe aktarılmasını istedi. Bu süreçte:
- İlk gerçek taksitli işlem ortaya çıktı (bkz. Faz 4'teki sonradan not) — parser hiçbir değişiklik gerektirmeden doğru ayrıştırdı.
- Yeni gerçek önekler bulundu ve eklendi: `PAYTR/` (boşluksuz, `PAYTR ÖD/`'den ayrı) ve `N KOLAY ODEM/`.
- 6 aylık veride neredeyse her ay tekrar eden ama önceden kategorisiz kalan 3 fatura markası `known-merchants.ts`'e eklendi: **Turkcell**, **Türksat Kablo TV**, **ASKİ (su)** (üçü de Ev/Fatura) — ASKİ özellikle `matchFold`'un neden gerekli olduğunun bir kanıtı daha oldu ("ASKI" Türkçe locale'de "askı" olur, "ı" katlanmadan "aski" anahtar kelimesiyle eşleşmezdi).
- 6 ekstre de kaydedildikten sonra bu düzeltmelerle **silinip yeniden aktarıldı** (kullanıcı henüz elle düzeltme yapmadığı için kayıpsız) — otomatik kategorize oranı %78'den **%80'e (132/164)** çıktı.
- Testlere gerçek veriden yeni vaka eklendi: `enpara-2026-03-installment-real.txt` (tam ekstre, gerçek taksit formatı) + `known-merchants.test.ts`/`normalize.test.ts`'e yeni önek/merchant testleri. Toplam test sayısı 86 → 94.

---

## ✅ Faz 7 — Dashboard (tamamlandı)

- [x] `lib/analytics/monthly-summary.ts` — `getMonthlySummary` (gelir/gider/net/işlem sayısı), `getMonthlyTrend` (12 aylık seri, tek gruplu sorgu — ay başına ayrı sorgu değil), `getLatestDataMonth` (varsayılan ay seçimi için)
- [x] `lib/analytics/category-breakdown.ts` — seçili ayda ana kategoriye göre net (EXPENSE-REFUND) dağılım, tutarlı kategori renkleri (`Category.color`)
- [x] `lib/analytics/comparisons.ts` — seçili ay vs bir önceki ay harcama karşılaştırması (spec §29)
- [x] `lib/analytics/upcoming.ts` — "Gelecek Taksitler" (spec §24) ve "Aylık Abonelikler" (spec §27) kartları için hafif özet sorguları — Faz 8/9'un tam kütüphaneleri (lib/installments/, lib/subscriptions/) henüz yok, bu yüzden burada yalnızca dashboard kartı için minimal, kendi içine kapalı bir hesaplama var (Installment/Subscription tabloları henüz doldurulmuyor)
- [x] `/dashboard` — ay navigasyonu (önceki/sonraki ay okları, `?month=YYYY-MM`), 4 KPI kartı (Toplam Gelir/Harcama/Net Durum/İşlem Sayısı + harcama kartında önceki aya göre %değişim rozeti), harcama trendi bar grafiği (6/12 ay geçiş butonlu, recharts), kategori donut grafiği + lejant, gelecek taksitler kartı, aylık abonelikler kartı, son işlemler listesi (`/transactions?month=` linkiyle)
- [x] İlk kullanım empty-state (spec §69) — hiç `Statement` yoksa karşılama ekranı + "Ekstre Yükle" CTA'sı
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı (kullanıcının gerçek 6 aylık verisiyle): KPI kartları doğru rakamlar gösterdi, 6/12 Ay geçişi ve ay navigasyon okları URL'i doğru güncelledi, "Tüm işlemleri gör" linki doğru ay filtresiyle `/transactions`'a gitti, masaüstü ve mobil genişlikte düzen bozulmadı, konsolda hiç hata yoktu

**Geliştirme sırasında bulunup düzeltilen gerçek hata:** Trend grafiğinin Y ekseni etiketleri 5 haneli tutarlarda kırpılıyordu (`"10000"` → `"0000"` gibi görünüyordu) — sabit `width={40}` büyük sayılar için yetersizdi. `width={64}` + `tickFormatter` (binlik ayraçlı Türkçe format) ile düzeltildi. Bu, yalnızca gerçek tarayıcıda ekran görüntüsü alınarak yakalandı; typecheck/lint/test/build hiçbiri bu görsel kırpmayı yakalamazdı.

**Not — gerçek veriyle doğrulanan beklenen davranış:** Ağustos 2026 dashboard'u yalnızca 4 işlem gösteriyor (diğer aylara göre çok düşük), çünkü Ağustos ekstresi (05/07–05/08 dönemi) işlemlerinin büyük çoğunluğu Temmuz tarihli — takvim ayı olarak "gerçek" Ağustos işlemlerinin çoğu, henüz yüklenmemiş olan Eylül ekstresinde yer alacak. Dashboard `Transaction.date`'e göre gruplama yaptığı için (CLAUDE.md kuralı, `Statement.month`'a göre değil) bu doğru ve beklenen bir sonuç — ayrı bir doğrulama olarak "Gelecek Taksitler" kartının da (tek gerçek taksitli işlem seti Ocak 2026'da 3 taksitle tamamlanmış) Ağustos itibarıyla boş görünmesi doğru hesaplandı.

**Sonradan not (Faz 8 sırasında bulunup düzeltildi):** Faz 7'nin "her zaman `Transaction.date`'e göre grupla" kuralı, taksit devam satırları için YANLIŞ çıktı — bkz. Faz 8'in "gerçek hata" notu ve CLAUDE.md'nin güncellenmiş Data model bölümü. Etkisi: gerçek veride tek bir taksitli işlem seti olduğu için (Ocak 2026 satın alma, Mart+Nisan'da faturalanan 2 taksit) dashboard'da ₺283 × 2 yanlışlıkla hiç görüntülenmeyen "Ocak 2026" ayına yazılıyordu (12 aylık trend grafiğinde hayalet bir "Oca" çubuğu olarak görünüyordu). Faz 8'in `transactionMonthFilter`/`getEffectiveMonth` düzeltmesiyle `lib/analytics/*` yeniden yazıldı, hata giderildi.

---

## ✅ Faz 8 — Taksit (tamamlandı)

- [x] `lib/installments/schedule.ts` — `buildInstallmentPlans` (saf/testable çekirdek) + `getInstallmentPlans` (DB sarmalayıcı): taksitli işlemleri satın alma bazında plana gruplar (`normalizedMerchant+date+amount+installmentTotal` anahtarıyla — bkz. aşağıdaki tarih notu), her plan için 1..totalInstallments TÜM ayları REAL (gerçek, içe aktarılmış)/MISSING (ara ekstre yüklenmemiş, enterpolasyon)/PROJECTED (gelecek, tahmini) olarak üretir
- [x] `lib/installments/calculations.ts` — `buildInstallmentBurdenByMonth`/`getInstallmentBurdenByMonth` (spec §24 gelecek ay bazlı taksit yükü), `getActivePlans`/`getCompletedPlans`/`getTotalRemainingDebt`
- [x] `/installments` — 3 KPI kartı (Aktif Taksit Sayısı/Toplam Kalan Borç/Gelecek Ay Taksit Tutarı), gelecek 6 aylık taksit yükü bar grafiği, Aktif/Tamamlanmış Taksitler tabloları, her satır için "Detay" diyaloğu (tam ödeme takvimi: taksit no/ay/tutar/durum rozeti)
- [x] `lib/analytics/upcoming.ts`'in `getUpcomingInstallmentsSummary`'si artık Faz 7'deki geçici hesaplama yerine bu gerçek kütüphaneyi kullanıyor
- [x] `Installment` tablosu bilinçli olarak boş bırakıldı — her şey `Transaction`'dan anlık hesaplanıyor (senkronizasyonu bozulabilecek bir önbellek yaratmamak için, bkz. CLAUDE.md)
- [x] 14 yeni test (`tests/installments/schedule.test.ts`, `calculations.test.ts`, + `tests/fingerprint.test.ts`'e eklenen `getEffectiveMonth` testleri) — gerçek TRENDYOL senaryosu dahil. Toplam test sayısı 94 → 108
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı: `/installments`'ta gerçek TRENDYOL taksiti "Tamamlanmış Taksitler"de doğru göründü, detay diyaloğu 1/3 (Şubat, "Ekstre yüklenmedi")/2/3 (Mart, "İçe aktarıldı")/3/3 (Nisan, "İçe aktarıldı") satırlarını doğru gösterdi, konsolda hata yoktu

**Geliştirme sırasında bulunup düzeltilen gerçek hata — taksit devam satırlarının tarihi:** Gerçek veri incelenirken (TRENDYOL taksiti, satın alma 29/01/2026) ortaya çıktı: Enpara her taksit satırında (2/3, 3/3, ...) `Transaction.date` olarak SABİT orijinal satın alma tarihini basıyor, o ayın faturalanma tarihini değil. DB'de doğrulandı: 2. taksit satırı Mart 2026 ekstresine ait (`statementId` → Statement.month=3) ama `date=2026-01-29`; 3. taksit Nisan ekstresine ait, yine `date=2026-01-29`. Bu, Faz 7'nin "her zaman Transaction.date'e göre grupla" kuralını taksit satırları için geçersiz kılıyordu — dashboard/`/transactions` ay filtresi bu satırları "Ocak 2026"ya (hiç ekstre yüklenmemiş bir aya) yazıyordu, gerçekte faturalandıkları Mart/Nisan'a değil. Düzeltme: `lib/db/transaction.service.ts`'e `getEffectiveMonth`/`transactionMonthFilter` eklendi (STATEMENT kaynaklı taksitli satırlarda `Statement.year/month` esas alınır, `Transaction.date` değil) ve `listTransactions`, `lib/analytics/monthly-summary.ts`, `category-breakdown.ts`, `lib/installments/schedule.ts` bunu kullanacak şekilde güncellendi. Bu hata hiçbir otomatik testte yakalanmazdı (Faz 4-7'nin tüm testleri sentetik veya taksitsiz gerçek veri kullanıyordu) — yalnızca gerçek 6 aylık veri üzerinde derinlemesine inceleme sırasında fark edildi. Detay için CLAUDE.md'nin Data model bölümüne bakın.

---

## ✅ Faz sırası dışı ek — Hesap Özeti İçe Aktarma (tamamlandı)

Kullanıcı `docs/` altına 6 aylık gerçek Enpara **hesap özeti** (vadesiz TL hesabı, kredi kartı ekstresinden tamamen ayrı bir PDF türü) ekleyip "toplam geliri belirleyebiliriz, gideri de görebiliriz, son durumu ölçebiliriz" isteğiyle bu veriyi uygulamaya entegre etmemizi istedi. Faz sırasına girmeyen, kullanıcı talebiyle araya giren bir iş olduğu için ayrı bir bölüm olarak kaydedildi.

- [x] `lib/bank-account/` — bağımsız parser (`parse-account-statement.ts`), sınıflandırma önerisi (`classify.ts`), bakiye zinciri doğrulaması (`validate.ts`)
- [x] Şema: yeni `AccountStatement` modeli + `Income.accountStatementId` — migration `20260829143823_add_account_statement`
- [x] Gelir/Hariç Tut sınıflandırması (iki durumlu, GİDER YOK): hesaptan çıkan HER hareket (EFT, Encard harcaması, ATM, kredi kartı ödemesi, yatırım transferi) her zaman Hariç Tut; kendi hesaplar arası GELEN transferler de Hariç Tut; geri kalan gelen transferler Gelir — hepsi önizlemede tek tek değiştirilebilir, giden hareketler yalnızca bakiye doğrulaması ve şeffaflık için gösterilir
- [x] UI tamamen `/income` içinde (`AccountStatementUploadCard`/`AccountStatementsTable`, `components/ui/tabs.tsx` — Base UI Tabs bu projede ilk kullanımı — ile YOK, düz bölüm olarak), `/statements`/`/transactions`'a hiç dokunmaz
- [x] Yalnızca `Income`'a yazıldığı için dashboard'un yalnızca "Toplam Gelir" (ve buna bağlı Net Durum) alanı etkilenir; Toplam Harcama/Harcama Trendi/Kategori Dağılımı/Son İşlemler/Güncel Kart Borcu ve `/transactions` sayfası tamamen kredi kartı verisiyle sınırlı kalır
- [x] 20 test (`tests/bank-account/`), gerçek 2 aylık fixture (Mart — en karmaşık çok satırlı örnek; Temmuz — Encard/Para Çekme örnekleri). Toplam test sayısı 111 → 129
- [x] Kullanıcının gerçek 6 aylık hesap özeti serisi (Şubat–Temmuz 2026) içe aktarıldı: 29 gelir eklendi — tüm 6 ayın bakiye zinciri sıfır uyarıyla doğrulandı (bir ayın hesaplanan dönem sonu bakiyesi bir sonrakinin dönem başı bakiyesiyle kuruşu kuruşuna eşleşti)
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı (upload → önizleme → kaydet → `/income`'a yansıma, `/transactions`/dashboard'un harcama tarafının etkilenmediği doğrulandı)

**Geliştirme sırasında bulunup düzeltilen gerçek hatalar:**
1. **`next build`, `typecheck`/`lint`/`test`'in yakalamadığı bir hata verdi**: ilk sürümde `/statements` sayfasına sekme olarak eklenmişti; sekme bileşeninin `useSearchParams()` kullanması, sayfayı `<Suspense>` ile sarmadan statik prerender'da "should be wrapped in a suspense boundary" hatasına yol açtı. CLAUDE.md kuralı ("build adımı da gerekli") bir kez daha somut olarak doğrulandı.
2. **Kapsam düzeltmesi (kullanıcı isteğiyle)**: İlk sürüm giden hareketleri de `Transaction` (source=BANK_ACCOUNT) olarak kaydediyor, bu da onları `/transactions`'da ve dashboard'un harcama tarafında (Toplam Harcama/Trend/Kategori Dağılımı/Son İşlemler) görünür kılıyordu. Kullanıcı bunun yalnızca gelir tarafını etkilemesini, `/transactions`'a hiç yansımamasını ve arayüzünün `/statements` yerine `/income` içinde olmasını istedi. Sonuç: `TransactionSource.BANK_ACCOUNT` ve `Transaction.accountStatementId` migration ile GERİ ALINDI (`20260829151801_remove_bank_account_transaction_link`), sınıflandırma Gelir/Gider/Hariç Tut'tan Gelir/Hariç Tut'a sadeleşti (`lib/bank-account/normalize.ts`'deki `deriveMerchantName`/`extractCounterpartyName` de bu süreçte kaldırıldı — yalnızca Transaction path'i kullanıyorlardı), tüm hesap özeti UI'ı `components/statements/`'tan `components/income/`'a, `/statements/import-account`'tan `/income/import-account`'a taşındı. Önceden kaydedilmiş 30 BANK_ACCOUNT `Transaction` satırı silindi, 29 `Income` satırı korundu (yeniden içe aktarmaya gerek kalmadı).

**Sonradan not — Faz 11'den sonra, kapsam bir kez daha daraltıldı (aynı gün):** Kullanıcı Dashboard'un "Toplam Gelir"ini vadesiz hesaba gelen−giden NET tutar olarak hesaplamayı istedi (örn. "88 bin gelmiş, 60 bin göndermişsem kalan 28 bin gelir"). Bunun için yeni bir `AccountOutflow` tablosu eklendi ve zaten içe aktarılmış 6 aylık hesap özeti PDF'i yeniden ayrıştırılıp giden satırları geriye dönük dolduruldu (additive, DB'ye ek migration). Gerçek sayılar hesaplanınca ortaya çıkan sonuç: **ayların çoğunda net NEGATİF** çıktı — çünkü en büyük "giden" kalemi gerçek harcama değil, kullanıcının kendi hesapları arasındaki transferlerdi (örn. tek bir ayda ₺66.500 "Giden Transfer, [kullanıcı adı], ..."). Kullanıcıya gerçek aylık rakamlarla "tüm gideni say" vs "kendi transferlerimi/kart ödemesini hariç tut" seçimi sorulmaya başlanmışken, kullanıcı fikrini tamamen değiştirdi: hesap özeti verisini Dashboard'dan TAMAMEN kaldırıp eskisi gibi (Faz sırası dışı ek'teki hâline) döndürmek istedi — hatta bir adım daha ileri giderek artık Toplam Gelir'i de etkilemesin dedi. Sonuç: `AccountOutflow` tablosu ikinci bir migration'la (`20260829185858_remove_account_outflow`) tekrar kaldırıldı, `lib/analytics/monthly-summary.ts`'in `getMonthlySummary`/`getMonthlyTrend`'i artık `Income` sorgularına `accountStatementId: null` filtresi ekliyor — hesap özeti kaynaklı gelir artık Dashboard'un HİÇBİR KPI'sına (Toplam Gelir dahil) yansımıyor, yalnızca `/income`'da görünüyor. Bu, "yeni bir para verisi kaynağını hangi sayfaların/KPI'ların yansıtması gerektiğini önceden netleştir" dersinin aynı gün içinde ikinci kez, daha da sıkı bir sınırla doğrulanmasıydı.

---

## ✅ Faz 9 — Abonelik (tamamlandı)

- [x] `lib/subscriptions/detect.ts` — saf/testable `detectSubscriptions` (spec §54): merchant bazında en uzun "tutarlı tekrar dizisi"ni bulur (ardışık işlemler arası gün farkı aylık [25-35] ya da yıllık [350-380] pencereye düşüyorsa VE tutar oranı ≤2.5x ise aynı diziye dahil edilir), en az 3 tekrar şartı, en sık geçen kategoriyi abonelik kategorisi olarak seçer
- [x] `lib/subscriptions/subscription.service.ts` — aday işlemleri çeker (taksitli olmayan gider, Finans/Bankacılık hariç), `syncSubscriptions` ile `Subscription` tablosuyla eşitler (yeni aday `confirmed:false` ile oluşturulur, var olan kayıtlarda türetilmiş alanlar güncellenir ama `active`/`confirmed` hiç dokunulmaz — merchant-rule.service.ts'teki find-then-create/update kalıbı izlenir, DB'de `@@unique` yok), `listPendingSubscriptions`/`listConfirmedSubscriptions`/`listInactiveSubscriptions`, `confirmSubscription`, `setSubscriptionActive`, `getMonthlyRecurringTotal`
- [x] `/subscriptions` — sayfa her ziyarette `syncSubscriptions()` çalıştırır, "Muhtemel Abonelikler" (Onayla/Yoksay), "Onaylı Abonelikler" (Pasif Yap) + tahmini aylık sabit gider kartı, "Pasif Abonelikler" (Aktif Yap, yalnızca doluysa gösterilir)
- [x] `lib/analytics/upcoming.ts`'in `getSubscriptionsSummary`'si artık gerçek `listConfirmedSubscriptions`/`getMonthlyRecurringTotal`'ı kullanıyor (Faz 7'nin placeholder'ı değil); dashboard'un boş-durum mesajı `/subscriptions`'a link veriyor
- [x] 8 yeni test (`tests/subscriptions/detect.test.ts`) — spec §54'ün kendi örneği, 2 gerçek pozitif senaryo, 2 gerçek sınır-durum senaryosu, sıralama/kategori seçimi. Toplam test sayısı 129 → 137
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı (kullanıcının gerçek 6 aylık verisiyle): `/subscriptions` 9 muhtemel abonelik listeledi (Turk Telekom, Claude, Turkcell, CapCut, ASKİ, Enerjisa, Google One, YouTube, YouTube Premium), "Onayla" tıklaması abonelik onayladı ve dashboard'un "Aylık Abonelikler" kartına doğru toplamla yansıdı, konsolda hata yoktu — test onayları doğrulama sonrası geri alındı (`confirmed: false`), DB temiz bırakıldı

**Algoritma tasarım kararı — cadence birincil, tutar ikincil gevşek sınır:** Gerçek veri üzerinde denenen ilk yaklaşım (tüm grup için sıkı ±%15 tutar toleransı) iki gerçek senaryoda başarısız oldu: (1) Google One'ın ilk ay deneme ücreti (₺65,99 → düzenli ₺199,99, oran 3.03x) grup ortalamasını bozuyordu, (2) YouTube Premium'un meşru fiyat zammı (₺79,99 → ₺119,99, son ayda, oran 1.5x) en YENİ tekrarı etkilediği için "sondan geriye tutarlı dizi" yaklaşımı da yetersiz kaldı (zam sonrası tek örnek <3 tekrar). Çözüm: birincil filtre CADENCE (ardışık gün farkı) — gerçek veride tek başına bunun MERVE MARKET (53 sık ama düzensiz market alışverişi) ve AYŞE DEMİR (kişiye düzensiz ödemeler) gibi sınır durumlarını doğru elediği doğrulandı (gap kontrolü zaten hepsini reddediyor, tutar kontrolüne gerek kalmadan) — tutar oranı yalnızca ardışık iki işlem arasında 2.5x'i aşan kopuk noktaları (deneme ücretleri gibi) ayırmak için gevşek bir ikincil sınır olarak kullanıldı. Bu, spec §54'ün "tutarın küçük farklılıkları kabul edilebilir" ifadesiyle ve MIN_OCCURRENCES=3 kuralıyla tutarlı.

**Kapsam kararı — banka faiz/ücret satırları abonelik adayı olarak değerlendirilmiyor:** Gerçek veride "Alışveriş faizi" ve "Faizlerin KKDF'si" gibi satırlar da ayda bir tekrar ediyor ve cadence testini geçiyordu, ama bunlar kullanıcı için bir "abonelik" değil (bakiyeye göre değişen faiz tahakkuku). `subscription.service.ts` bu satırları alt kategori adı "Bankacılık" ile eşleştirip sorgu seviyesinde dışlıyor — `engine.ts`'teki `resolveCategoryByName` ile aynı isim-eşleştirme kalıbı (kullanıcı bu alt kategoriyi yeniden adlandırırsa filtre sessizce devre dışı kalır, hata fırlatmaz).

**Sonradan not — Faz 10'dan önce, kullanıcı isteğiyle iki ek özellik:**
1. **"Ay ay gerçek tutar" (Faz 11'den önce eklendi):** Kullanıcı "faturalar her ay değişiyor, bazı aboneliklere zam gelebiliyor, tek bir sabit fiyat vermek mantıksız" diye belirtti — `Subscription.averageAmount` (sabit, tarihsel ortalama) hem Dashboard'un "Aylık Abonelikler" kartında hem `/subscriptions`'ta TEK rakam olarak gösteriliyordu. Çözüm: `subscription.service.ts`'e `getActualMonthlyAmounts`/`withCurrentMonthAmounts` eklendi — her abonelik için seçili ayın GERÇEK `Transaction` tutarı kullanılıyor, o ay için henüz işlem yoksa (fatura gelmediyse) `averageAmount`'a düşülüyor ve `isEstimated: true` ile işaretleniyor (spec §70 Kural 7: asla sessizce varsayma). `lib/analytics/upcoming.ts`'in `getSubscriptionsSummary`'si artık `(year, month)` alıyor; `/subscriptions` tablosundaki "Ortalama Tutar" sütunu "Bu Ay" oldu (gerçek tutar + altında küçük "Ort: X" referansı). Gerçek veriyle doğrulandı: aylık toplam Mart'tan Temmuz'a 2.722→2.903→3.125→3.145→3.331 TL arasında değişti (önceden hep aynı ~3.049 TL görünürdü).
2. **`/transactions` düzenleme diyaloğuna "Abonelik olarak işaretle" onay kutusu:** Otomatik tespiti (`detectSubscriptions`, en az 3 tekrar şartı) beklemeden kullanıcının tek bir işlem üzerinden doğrudan onaylı bir abonelik oluşturmasını/pasifleştirmesini sağlıyor (`subscription.service.ts`'teki yeni `setManualSubscription` — `merchant` alanına göre find-then-create/update, `syncSubscriptions` ile aynı kalıp). Yalnızca DÜZENLEME modunda gösteriliyor (yeni işlem oluştururken değil — henüz DB'de id yok). `app/transactions/actions.ts`'teki `setTransactionSubscriptionAction`, diyalog kapandıktan sonra ayrı bir çağrı olarak tetikleniyor (kategori değişince tetiklenen "Gelecekte de uygula?" toast'ıyla aynı desen: ana form action'ından bağımsız, başarı sonrası ek bir server action çağrısı).

---

## ✅ Faz 10 — Bütçe (tamamlandı)

- [x] `lib/db/budget.service.ts` — `createBudget`/`updateBudget` (aynı kategori+alt kategori kombinasyonu için ikinci bütçeyi engeller, `BudgetDuplicateError`), `deleteBudget`, `computeBudgetProgress` (saf çekirdek — `buildInstallmentPlans`/`detectSubscriptions` ile aynı DB'den bağımsız test edilebilirlik ayrımı) + `listBudgetsWithProgress` (DB sarmalayıcı, tek sorgu — spec §56)
- [x] `lib/validation/budget.schema.ts` — zod şeması, `moneyField`/`optionalId` paylaşılan alanları yeniden kullanılıyor
- [x] `/budgets` — "Yeni Bütçe" formu (ana kategori + opsiyonel alt kategori, `TransactionFormDialog` ile aynı basamaklı select deseni), her bütçe için ilerleme çubuğu (`%80` üzeri turuncu, aşımda kırmızı + "Bütçe aşıldı" rozeti), düzenle/sil (generic `ConfirmDeleteButton`)
- [x] Bütçe hesabı ana kategoride (subCategoryId: null) o kategorinin TÜM harcamasını (alt kategoriler dahil) kapsar, alt kategori bazlı bütçe yalnızca o alt kategoriyi sayar — `Transaction.categoryId`'nin her zaman ana kategoriyi taşıması sayesinde (bkz. CLAUDE.md) ekstra bir toplama adımına gerek kalmadı
- [x] Ay eşleşmesi `transactionMonthFilter` ile yapılıyor (taksitli ekstre satırları için ekstre dönemi esas alınır, spec §53) — sayfa varsayılan olarak `getLatestDataMonth()`'u kullanıyor, ayrı bir ay navigasyonu yok (kapsam kullanıcıyla netleştirildi, bkz. aşağı)
- [x] `components/ui/progress.tsx` — Base UI `Progress` primitive'i shadcn CLI ile eklendi (`base-nova` stiliyle uyumlu); aşım rengini satır bazlı değiştirebilmek için sayfa `ProgressPrimitive.Root`'u doğrudan, `ProgressTrack`/`ProgressIndicator` alt bileşenlerini elle kompoze ediyor (üretilen `Progress` sarmalayıcısı kendi track/indicator'ını sabit renkle zorunlu kıldığı için)
- [x] 5 yeni test (`tests/budgets/progress.test.ts`) — ana/alt kategori ayrımı, REFUND düşümü, aşım, negatif net iadenin 0'a kırpılması, boş işlem seti. Toplam test sayısı 137 → 142
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı: bütçe oluştur → aynı kategoriye ikinci bütçe denemesi doğru hata mesajıyla engellendi ("Bu kategori için zaten bir bütçe tanımlı. Mevcut bütçeyi düzenleyin.") → limiti düşürüp güncelleyince "Bütçe aşıldı" rozeti + kırmızı ilerleme çubuğu (%100'de kırpılmış bar, gerçek %9800 metni) doğru göründü → silindi, DB temiz bırakıldı, konsolda gerçek bir hata yoktu (yalnızca Faz 3'te belgelenen zararsız Base UI dev-uyarısı)

**Kapsam kararı (kullanıcıyla netleştirildi):** spec §36 "Dashboard'da gösterilmelidir" ifadesine rağmen, kullanıcı Dashboard'u sade tutmak istediğini belirtti (bu fazdan hemen önce Son İşlemler bölümünü kaldırmıştı) — bütçe ilerlemesi yalnızca `/budgets` sayfasında gösteriliyor, Dashboard'a ayrı bir özet kartı eklenmedi.

---

## ✅ Faz 11 — Raporlar (tamamlandı)

- [x] `lib/analytics/top-merchants.ts` — `getTopMerchants` (seçili ayda net EXPENSE-REFUND'a göre en çok harcanan merchant'lar, spec §55)
- [x] `lib/analytics/category-trend.ts` — `getCategoryTrend` (son N ayda en çok harcanan topN ana kategorinin ay bazlı serisi) — `getMonthlyTrend` ile AYNI iki-sorgulu desen (normal işlemler tarih aralığına göre + ekstre kaynaklı taksitli işlemler `getEffectiveMonth`'a göre kovaya dağıtılır), tek ay değil zaman serisi göstermesi dashboard'un `getCategoryBreakdown`'ından farkı
- [x] `/reports` — ay navigasyonu (`MonthNav`, dashboard'la aynı bileşen), Gelir/Gider grafiği (yeni `IncomeExpenseTrendChart`), Kategori Trendi (yeni `CategoryTrendChart`, yığılmış bar), En Çok Harcama Yapılan Merchant'lar (yeni `TopMerchantsList`), Gelecek Taksit Yükü + Aylık Abonelikler (Faz 8/9'un `UpcomingBurdenChart`/`SubscriptionsSummaryCard` bileşenleri AYNEN yeniden kullanıldı — spec §55'in bu iki maddesi zaten var olan verilerle karşılanıyor), Aylık Karşılaştırma tablosu (yeni `MonthlyComparisonTable`, gelir/gider/net + bir önceki aya göre %değişim)
- [x] `/history` — yıl navigasyonu (yeni `YearNav`), `getMonthlyTrend(year, 12, 12)` ile tek sorguda yılın 12 ayı, her satır `/dashboard?month=YYYY-MM`'a link (spec §32 birebir mockup formatı: ay adı + tutar, ek olarak küçük "Net" bilgisi)
- [x] Yeni analytics fonksiyonları (`monthly-summary.ts`/`category-breakdown.ts` ile aynı) kasıtlı olarak ayrı unit test almadı — bu dosyalar da hiç test edilmiyor, doğrulama gerçek 6 aylık veriyle tarayıcıda yapılıyor (proje kuralı: sadece gerçekten algoritmik karmaşıklığı olan çekirdekler — `schedule.ts`/`detect.ts`/Faz 10'un `computeBudgetProgress`'i — saf fonksiyona ayrılıp test ediliyor)
- [x] Playwright ile gerçek tarayıcıda uçtan uca doğrulandı (kullanıcının gerçek verisiyle, Temmuz 2026 seçili): tüm 6 bölüm doğru render oldu (Gelir/Gider, Kategori Trendi, Top Merchant'lar, Taksit Yükü, Abonelikler, Aylık Karşılaştırma), `/history`'de 12 ay listelendi ve bir aya tıklamak doğru `?month=` parametresiyle `/dashboard`'a yönlendirdi, konsolda hata yoktu

**Kapsam notu — Dashboard'daki Bank Account gelir hariç tutma kuralının Reports'a da yansıması:** `getMonthlyTrend`/`getMonthlySummary` zaten hesap özeti kaynaklı `Income` satırlarını hariç tutuyor (önceki oturumda kullanıcı isteğiyle eklendi — bkz. "hesap özeti sadece /income'da kalsın" kararı). `/reports`'un Gelir/Gider grafiği bu paylaşılan fonksiyonları kullandığı için otomatik olarak aynı kuralı miras aldı — bu istenen davranış: kullanıcının "sadece gelir kısmında kalsın" talebi Dashboard'a özel değil, genel bir kısıtlamaydı.

---

## ⬜ Faz 12 — AI (opsiyonel, en son)

- [ ] `lib/ai/provider.ts` arayüzü zaten planlanmış; `ollama.ts` / `openai.ts` bağlanacak
- [ ] Önce "Aylık Finansal Özet", sonra "Doğal Dil Finansal Sorgular" (MVP sonrası)
