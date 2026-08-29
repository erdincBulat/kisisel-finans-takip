import { describe, expect, it } from "vitest";
import { detectSubscriptions, type SubscriptionSourceRow } from "@/lib/subscriptions/detect";

function row(overrides: Partial<SubscriptionSourceRow> & Pick<SubscriptionSourceRow, "id" | "date" | "amount">): SubscriptionSourceRow {
  return {
    normalizedMerchant: "ChatGPT",
    categoryId: "cat-teknoloji",
    ...overrides,
  };
}

describe("detectSubscriptions", () => {
  it("spec §54 örneği: 3 ardışık aylık ödeme yüksek abonelik skoru almalı", () => {
    const rows: SubscriptionSourceRow[] = [
      row({ id: "1", date: new Date(Date.UTC(2026, 5, 15)), amount: 75000 }),
      row({ id: "2", date: new Date(Date.UTC(2026, 6, 15)), amount: 75000 }),
      row({ id: "3", date: new Date(Date.UTC(2026, 7, 15)), amount: 75000 }),
    ];

    const [candidate] = detectSubscriptions(rows);

    expect(candidate.merchant).toBe("ChatGPT");
    expect(candidate.frequency).toBe("MONTHLY");
    expect(candidate.occurrenceCount).toBe(3);
    expect(candidate.averageAmount).toBe(75000);
    expect(candidate.lastChargeDate).toEqual(new Date(Date.UTC(2026, 7, 15)));
    expect(candidate.nextExpectedDate).toEqual(new Date(Date.UTC(2026, 8, 15)));
  });

  it("2'den az tekrar varsa aday üretmez (spec §54: en az 3 tekrar)", () => {
    const rows: SubscriptionSourceRow[] = [
      row({ id: "1", date: new Date(Date.UTC(2026, 5, 15)), amount: 75000 }),
      row({ id: "2", date: new Date(Date.UTC(2026, 6, 15)), amount: 75000 }),
    ];

    expect(detectSubscriptions(rows)).toEqual([]);
  });

  it("gerçek veri: Google One — ilk ay deneme ücreti (₺65,99) tespit dizisini kesmeli, kalan 5 ay ₺199,99 ile MONTHLY olarak bulunmalı", () => {
    const rows: SubscriptionSourceRow[] = [
      row({ id: "g1", date: new Date(Date.UTC(2026, 1, 19)), amount: 6599, normalizedMerchant: "Google One", categoryId: "cat-teknoloji" }),
      row({ id: "g2", date: new Date(Date.UTC(2026, 2, 19)), amount: 19999, normalizedMerchant: "Google One", categoryId: "cat-teknoloji" }),
      row({ id: "g3", date: new Date(Date.UTC(2026, 3, 19)), amount: 19999, normalizedMerchant: "Google One", categoryId: "cat-teknoloji" }),
      row({ id: "g4", date: new Date(Date.UTC(2026, 4, 19)), amount: 19999, normalizedMerchant: "Google One", categoryId: "cat-teknoloji" }),
      row({ id: "g5", date: new Date(Date.UTC(2026, 5, 19)), amount: 19999, normalizedMerchant: "Google One", categoryId: "cat-teknoloji" }),
      row({ id: "g6", date: new Date(Date.UTC(2026, 6, 19)), amount: 19999, normalizedMerchant: "Google One", categoryId: "cat-teknoloji" }),
    ];

    const [candidate] = detectSubscriptions(rows);

    expect(candidate.merchant).toBe("Google One");
    expect(candidate.occurrenceCount).toBe(5);
    expect(candidate.averageAmount).toBe(19999);
    expect(candidate.transactionIds).not.toContain("g1");
    expect(candidate.transactionIds).toEqual(["g2", "g3", "g4", "g5", "g6"]);
  });

  it("gerçek veri: YouTube Premium fiyat zammı (₺79,99 → ₺119,99) meşru bir abonelik artışıdır, dizi kırılmamalı", () => {
    const rows: SubscriptionSourceRow[] = [
      row({ id: "y1", date: new Date(Date.UTC(2026, 1, 24)), amount: 7999, normalizedMerchant: "YouTube Premium", categoryId: "cat-teknoloji" }),
      row({ id: "y2", date: new Date(Date.UTC(2026, 2, 24)), amount: 7999, normalizedMerchant: "YouTube Premium", categoryId: "cat-teknoloji" }),
      row({ id: "y3", date: new Date(Date.UTC(2026, 3, 24)), amount: 7999, normalizedMerchant: "YouTube Premium", categoryId: "cat-teknoloji" }),
      row({ id: "y4", date: new Date(Date.UTC(2026, 4, 24)), amount: 7999, normalizedMerchant: "YouTube Premium", categoryId: "cat-teknoloji" }),
      row({ id: "y5", date: new Date(Date.UTC(2026, 5, 24)), amount: 7999, normalizedMerchant: "YouTube Premium", categoryId: "cat-teknoloji" }),
      row({ id: "y6", date: new Date(Date.UTC(2026, 6, 24)), amount: 11999, normalizedMerchant: "YouTube Premium", categoryId: "cat-teknoloji" }),
    ];

    const [candidate] = detectSubscriptions(rows);

    expect(candidate.occurrenceCount).toBe(6);
    expect(candidate.frequency).toBe("MONTHLY");
    // ortalama son (zamlı) fiyatı biraz aşağı çeker — bilinçli, spec §54 "küçük farklılıklar kabul edilebilir"
    expect(candidate.averageAmount).toBe(Math.round((7999 * 5 + 11999) / 6));
    expect(candidate.lastChargeDate).toEqual(new Date(Date.UTC(2026, 6, 24)));
  });

  it("sınır durumu — gerçek veri: AYŞE DEMİR (kişiye düzensiz ödemeler) abonelik olarak işaretlenmemeli", () => {
    const rows: SubscriptionSourceRow[] = [
      { id: "l1", date: new Date(Date.UTC(2026, 1, 14)), amount: 14500, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l2", date: new Date(Date.UTC(2026, 5, 5)), amount: 26750, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l3", date: new Date(Date.UTC(2026, 5, 14)), amount: 17000, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l4", date: new Date(Date.UTC(2026, 6, 3)), amount: 14000, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l5", date: new Date(Date.UTC(2026, 6, 3)), amount: 4000, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l6", date: new Date(Date.UTC(2026, 6, 23)), amount: 10500, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l7", date: new Date(Date.UTC(2026, 6, 25)), amount: 7000, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l8", date: new Date(Date.UTC(2026, 6, 27)), amount: 7000, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
      { id: "l9", date: new Date(Date.UTC(2026, 6, 30)), amount: 7000, normalizedMerchant: "AYŞE DEMİR", categoryId: null },
    ];

    expect(detectSubscriptions(rows)).toEqual([]);
  });

  it("sınır durumu — gerçek veri: MERVE MARKET (sık ama düzensiz market alışverişi) abonelik olarak işaretlenmemeli", () => {
    const dates = [
      "2026-02-05", "2026-02-08", "2026-02-10", "2026-02-15", "2026-02-16",
      "2026-04-24", "2026-04-25", "2026-04-27", "2026-04-30",
      "2026-05-01", "2026-05-03", "2026-05-09", "2026-05-10", "2026-05-12", "2026-05-14", "2026-05-16", "2026-05-16",
      "2026-05-18", "2026-05-19", "2026-05-20", "2026-05-22", "2026-05-23", "2026-05-26", "2026-05-27", "2026-05-29", "2026-05-31",
      "2026-06-02", "2026-06-04", "2026-06-06", "2026-06-07", "2026-06-09", "2026-06-10", "2026-06-13", "2026-06-16", "2026-06-17",
      "2026-06-19", "2026-06-22", "2026-06-24", "2026-06-25", "2026-06-26", "2026-06-28", "2026-06-29", "2026-06-30",
      "2026-07-02", "2026-07-05", "2026-07-09", "2026-07-10", "2026-07-12", "2026-07-14", "2026-07-19", "2026-07-21", "2026-07-28",
      "2026-08-01",
    ];
    const amounts = [
      10000, 18000, 6000, 12500, 8400,
      7000, 12750, 14500, 16000,
      7000, 23000, 8500, 8750, 12800, 12500, 14000, 17500,
      7000, 18000, 8000, 10300, 5250, 10500, 7000, 7000, 7000,
      10500, 10500, 7000, 11000, 7000, 7000, 7000, 25500, 10000,
      16000, 19500, 7000, 10500, 11500, 16000, 7000, 10500,
      17000, 14000, 20250, 7000, 7250, 12000, 7000, 9500, 10500,
      9800,
    ];

    const rows: SubscriptionSourceRow[] = dates.map((d, i) => ({
      id: `m${i}`,
      date: new Date(`${d}T00:00:00.000Z`),
      amount: amounts[i],
      normalizedMerchant: "MERVE MARKET",
      categoryId: "cat-market",
    }));

    expect(detectSubscriptions(rows)).toEqual([]);
  });

  it("farklı merchant'ları birbirinden bağımsız değerlendirir ve tutara göre büyükten küçüğe sıralar", () => {
    const rows: SubscriptionSourceRow[] = [
      row({ id: "a1", date: new Date(Date.UTC(2026, 1, 1)), amount: 10000, normalizedMerchant: "Spotify" }),
      row({ id: "a2", date: new Date(Date.UTC(2026, 2, 1)), amount: 10000, normalizedMerchant: "Spotify" }),
      row({ id: "a3", date: new Date(Date.UTC(2026, 3, 1)), amount: 10000, normalizedMerchant: "Spotify" }),
      row({ id: "b1", date: new Date(Date.UTC(2026, 1, 10)), amount: 60000, normalizedMerchant: "Adobe" }),
      row({ id: "b2", date: new Date(Date.UTC(2026, 2, 10)), amount: 60000, normalizedMerchant: "Adobe" }),
      row({ id: "b3", date: new Date(Date.UTC(2026, 3, 10)), amount: 60000, normalizedMerchant: "Adobe" }),
    ];

    const candidates = detectSubscriptions(rows);

    expect(candidates.map((c) => c.merchant)).toEqual(["Adobe", "Spotify"]);
  });

  it("en sık geçen kategoriyi abonelik kategorisi olarak seçer", () => {
    const rows: SubscriptionSourceRow[] = [
      row({ id: "1", date: new Date(Date.UTC(2026, 1, 15)), amount: 5000, categoryId: "cat-eski" }),
      row({ id: "2", date: new Date(Date.UTC(2026, 2, 15)), amount: 5000, categoryId: "cat-teknoloji" }),
      row({ id: "3", date: new Date(Date.UTC(2026, 3, 15)), amount: 5000, categoryId: "cat-teknoloji" }),
      row({ id: "4", date: new Date(Date.UTC(2026, 4, 15)), amount: 5000, categoryId: "cat-teknoloji" }),
    ];

    const [candidate] = detectSubscriptions(rows);
    expect(candidate.categoryId).toBe("cat-teknoloji");
  });
});
