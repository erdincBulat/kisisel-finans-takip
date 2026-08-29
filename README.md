# Kişisel Finans Takip Uygulaması

Lokal (localhost) çalışan, tek kullanıcılı kişisel finans ve harcama takip uygulaması. Enpara kredi kartı ekstre PDF'lerini içe aktarır, işlemleri otomatik kategorize eder, taksit/abonelik takibi yapar ve aylık finansal durumu dashboard üzerinde gösterir.

**Durum:** Faz 1–4 tamamlandı ve doğrulandı (typecheck/lint/test/build yeşil). Kategoriler, işlemler ve gelirler için tam CRUD çalışıyor (Playwright ile uçtan uca test edildi). Enpara PDF parser tamamlandı ve gerçek referans ekstre üzerinde uçtan uca doğrulandı (37/37 işlem, mutabakat toplamları birebir tutuyor) — ancak henüz bir yükleme ekranına bağlanmadı (bu Faz 5'te). Diğer ekranlar (Ekstreler, Abonelikler, Taksitler, Bütçe, Raporlar, Geçmiş, Ayarlar) şu an placeholder durumda; her sayfa hangi fazda doldurulacağını kendi üzerinde gösteriyor.

## Kaynaklar

- `PROJECT_SPEC.md` — orijinal ürün/teknik gereksinim dokümanının kopyası (74 bölüm).
- Mimari plan (Claude Code tarafından üretilen): `PROJECT ANALYSIS / ARCHITECTURE / DATABASE DESIGN / SCREEN STRUCTURE / IMPLEMENTATION PLAN / RISKS` başlıklarını içerir; klasör yapısı bu plana göre oluşturulmuştur.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4 + shadcn/ui · Prisma 7 + SQLite (better-sqlite3 driver adapter) · Recharts · zod · date-fns · vitest.

**Not — Prisma 7:** `datasource.url` artık `schema.prisma` içinde tanımlanmıyor; CLI konfigürasyonu `prisma7.config.ts` dosyasında, runtime bağlantısı ise `PrismaClient`'a verilen bir driver adapter (`@prisma/adapter-better-sqlite3`) üzerinden yapılıyor (bkz. `lib/db/client.ts`, `prisma/seed.ts`).

## Komutlar

```bash
npm run dev          # localhost:3000
npm run build         # production build
npm run typecheck
npm run lint
npm run test          # vitest
npm run db:migrate    # yeni migration oluştur/uygula
npm run db:seed       # varsayılan kategorileri yükle
npm run db:studio     # Prisma Studio
```

## Geliştirme Fazları

Sıralama `PROJECT_SPEC.md` §59 ve mimari plandaki IMPLEMENTATION PLAN bölümünde tanımlıdır:

1. ✅ Kurulum → 2. ✅ Database → 3. ✅ Manuel işlemler → 4. ✅ PDF Parser → 5. Import Preview → 6. Kategori Hafızası → 7. Dashboard → 8. Taksit → 9. Abonelik → 10. Bütçe → 11. Raporlar → 12. AI.

Detaylı faz checklist'i: [`docs/PHASES.md`](./docs/PHASES.md).

## Klasör Yapısı

```
app/            Next.js sayfaları (route başına bir klasör)
components/     UI bileşenleri (layout/, domain klasörleri + ui/ = shadcn primitives)
lib/            İş mantığı: db, pdf, categorization, merchants, installments,
                subscriptions, analytics, budgets, ai, money.ts, validation
prisma/         schema.prisma + seed.ts
data/           finance.db (SQLite, git'e dahil değil)
tests/          parser / categorization / installments / analytics unit testleri
```

Henüz doldurulmamış dosyaların başındaki yorum satırı, o dosyanın hangi fazda ve ne amaçla doldurulacağını belirtir.
