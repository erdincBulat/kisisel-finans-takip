# Backlog — Denetim Bulguları (2026-08-29) — KAPANDI

Bu dosya, uygulamanın genel bir denetiminden (kod kalitesi + spec uyumluluğu + gerçek veriyle canlı tarayıcı taraması) çıkan bulguları kaydediyordu. Tüm liste 2026-08-29 içinde kapatıldı.

**Düzeltilenler** (aynı denetimden, aynı gün): Top Merchants'ın banka ücretlerini göstermesi, abonelik "Bu Ay" hesabının taksitli işlem sızıntısına açık olması, `syncSubscriptions`'ın sıralı (N+1) yazması, TL string formatlamasının 3 yerde kopyalanması, `addKurus`/`tlToKurus` ölü kodu — bkz. git geçmişi.

**Eksik özellikler (1-6), düzeltildi** — bkz. `docs/PHASES.md`'deki iki "Faz sırası dışı ek" notu:
1. `/settings` hub'ı (Kategori/Bütçe/Merchant Kuralları/Abonelikler linkleri)
2. `/settings/merchant-rules` — Merchant Kuralları listeleme/düzenleme/silme
3. `/transactions` — Merchant kolonu + Kaynak filtresi
4. `/settings/data` — Veri Yönetimi (konum/boyut/indirme)
5. Sayfa/bölüm seviyesinde boş durum mesajları (Raporlar/Geçmiş/Kategoriler)
6. Yanlış PDF için geri alma (ekstre/hesap özeti silme)

**Gözlemler / ürün fırsatları (7-10), kullanıcı kararıyla KAPATILDI — yapılmayacak:**
7. Hesap özetinden gelen gelir kayıtları için toplu kategori atama
8. Abonelik "Sıradaki Ödeme" tarihi için gecikme işareti
9. "İnternet Alışverişi" / "Ev İnternet Alışverişi" kategori isim çakışması
10. Boş bütçe gözlemi (kod değişikliği gerektirmiyordu)

Bu dört madde birer hata değil, gözlemdi; kullanıcı bunların gereksiz olduğuna karar verdi, kod tabanında bir karşılıkları yok.
