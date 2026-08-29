export type SubscriptionFrequency = "MONTHLY" | "YEARLY";

export type SubscriptionSourceRow = {
  id: string;
  date: Date;
  normalizedMerchant: string;
  amount: number; // kuruş
  categoryId: string | null;
};

export type SubscriptionCandidate = {
  merchant: string;
  categoryId: string | null;
  averageAmount: number; // kuruş
  frequency: SubscriptionFrequency;
  lastChargeDate: Date;
  nextExpectedDate: Date;
  occurrenceCount: number;
  transactionIds: string[];
};

const MIN_OCCURRENCES = 3; // spec §54
const MONTHLY_GAP_DAYS: [number, number] = [25, 35]; // spec §54
const YEARLY_GAP_DAYS: [number, number] = [350, 380];

/**
 * Ardışık iki ücret arasında kabul edilebilir en büyük oran (büyük/küçük).
 * Gerçek veride doğrulandı: YouTube Premium ₺79,99 → ₺119,99 zammı (oran
 * 1.5x) meşru bir abonelik fiyat artışıdır ve diziden ATILMAMALI ("tutarın
 * küçük farklılıkları kabul edilebilir", spec §54); ama Google One'ın ilk ay
 * deneme ücreti ₺65,99 → ₺199,99 (oran 3.03x) gerçek aylık ücretten kopuk bir
 * nokta olduğu için diziyi BURADA kesmeli. 2.5x eşiği ikisini de doğru
 * ayırıyor — bkz. tests/subscriptions/detect.test.ts gerçek veri senaryoları.
 */
const MAX_AMOUNT_RATIO = 2.5;

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function frequencyOfGap(days: number): SubscriptionFrequency | null {
  if (days >= MONTHLY_GAP_DAYS[0] && days <= MONTHLY_GAP_DAYS[1]) return "MONTHLY";
  if (days >= YEARLY_GAP_DAYS[0] && days <= YEARLY_GAP_DAYS[1]) return "YEARLY";
  return null;
}

function addInterval(date: Date, frequency: SubscriptionFrequency): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + (frequency === "MONTHLY" ? 1 : 12));
  return result;
}

function mostCommonCategoryId(rows: SubscriptionSourceRow[]): string | null {
  const counts = new Map<string | null, number>();
  for (const row of rows) counts.set(row.categoryId, (counts.get(row.categoryId) ?? 0) + 1);

  let best: string | null = null;
  let bestCount = -1;
  for (const [categoryId, count] of counts) {
    if (count > bestCount) {
      best = categoryId;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Tarih sırasına göre verilmiş aynı merchant'a ait işlemler içinde en uzun
 * "tutarlı tekrar dizisini" bulur: ardışık iki işlem arasındaki gün farkı
 * aylık ya da yıllık pencereye düşüyorsa VE tutar oranı MAX_AMOUNT_RATIO'yu
 * aşmıyorsa aynı diziye eklenir. Frekans türü dizinin ilk adımında kilitlenir
 * — pencereler örtüşmediği için (25-35 vs 350-380 gün) bir dizi içinde aylık
 * ve yıllık karışamaz.
 *
 * Yalnızca CADENCE (tekrar aralığı) birincil filtre olarak kullanılıyor,
 * tutar ikincil bir gevşek sınır — gerçek veride bunun neden yeterli/güvenilir
 * olduğu (MERVE MARKET/AYŞE DEMİR gibi sık ama düzensiz harcamaların
 * tamamen aralık uyuşmazlığıyla elendiği, tutar kontrolüne gerek kalmadığı)
 * tests/subscriptions/detect.test.ts'te gerçek veriyle doğrulandı.
 */
function findBestRun(
  sorted: SubscriptionSourceRow[],
): { run: SubscriptionSourceRow[]; frequency: SubscriptionFrequency } | null {
  let bestRun: SubscriptionSourceRow[] = [];
  let bestFrequency: SubscriptionFrequency | null = null;

  let currentRun: SubscriptionSourceRow[] = [sorted[0]];
  let currentFrequency: SubscriptionFrequency | null = null;

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const cur = sorted[i];
    const gapFrequency = frequencyOfGap(daysBetween(prev.date, cur.date));
    const ratio = Math.max(prev.amount, cur.amount) / Math.min(prev.amount, cur.amount);
    const continuesRun = gapFrequency !== null && (currentFrequency === null || gapFrequency === currentFrequency) && ratio <= MAX_AMOUNT_RATIO;

    if (continuesRun) {
      currentRun.push(cur);
      currentFrequency = gapFrequency;
    } else {
      if (currentRun.length > bestRun.length) {
        bestRun = currentRun;
        bestFrequency = currentFrequency;
      }
      currentRun = [cur];
      currentFrequency = null;
    }
  }
  if (currentRun.length > bestRun.length) {
    bestRun = currentRun;
    bestFrequency = currentFrequency;
  }

  if (bestRun.length < MIN_OCCURRENCES || !bestFrequency) return null;
  return { run: bestRun, frequency: bestFrequency };
}

/**
 * Tekrar eden işlemleri abonelik adaylarına dönüştürür (spec §25/§54). Saf/
 * senkron fonksiyon — DB'ye dokunmaz, testte doğrudan çağrılabilir (bkz.
 * lib/installments/schedule.ts'teki buildInstallmentPlans ile aynı ayrım).
 * Sonuç kesin kabul edilmemeli — çağıran taraf bunları `confirmed: false`
 * adaylar olarak DB'ye yazmalı, kullanıcı onaylamadan aktif abonelik sayılmaz.
 */
export function detectSubscriptions(rows: SubscriptionSourceRow[]): SubscriptionCandidate[] {
  const groups = new Map<string, SubscriptionSourceRow[]>();
  for (const row of rows) {
    const list = groups.get(row.normalizedMerchant) ?? [];
    list.push(row);
    groups.set(row.normalizedMerchant, list);
  }

  const candidates: SubscriptionCandidate[] = [];

  for (const [merchant, group] of groups) {
    if (group.length < MIN_OCCURRENCES) continue;

    const sorted = [...group].sort((a, b) => a.date.getTime() - b.date.getTime());
    const best = findBestRun(sorted);
    if (!best) continue;

    const { run, frequency } = best;
    const last = run[run.length - 1];

    candidates.push({
      merchant,
      categoryId: mostCommonCategoryId(run),
      averageAmount: Math.round(run.reduce((sum, r) => sum + r.amount, 0) / run.length),
      frequency,
      lastChargeDate: last.date,
      nextExpectedDate: addInterval(last.date, frequency),
      occurrenceCount: run.length,
      transactionIds: run.map((r) => r.id),
    });
  }

  return candidates.sort((a, b) => b.averageAmount - a.averageAmount);
}
