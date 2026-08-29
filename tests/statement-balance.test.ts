import { describe, expect, it } from "vitest";
import { computeEndingBalance } from "@/lib/db/statement.service";

describe("computeEndingBalance", () => {
  it("previousBalance yoksa (ilk ekstre) null döner", () => {
    expect(computeEndingBalance(null, 100000, 0)).toBeNull();
  });

  it("formülü doğru uygular: previousBalance + totalAmount - paymentsTotal", () => {
    expect(computeEndingBalance(1767958, 949979, 720000)).toBe(1997937);
  });

  it("gerçek 6 aylık zincir: her ayın sonucu bir sonraki ayın previousBalance'ına eşit çıkıyor", () => {
    // Kaynak: gerçek DB'den doğrulanmış Mart-Ağustos 2026 verisi.
    const months = [
      { previousBalance: 1767958, totalAmount: 949979, paymentsTotal: 720000 }, // Mart
      { previousBalance: 1997937, totalAmount: 299565, paymentsTotal: 1000000 }, // Nisan
      { previousBalance: 1297502, totalAmount: 690608, paymentsTotal: 700000 }, // Mayıs
      { previousBalance: 1288110, totalAmount: 1585420, paymentsTotal: 800000 }, // Haziran
      { previousBalance: 2073530, totalAmount: 1256887, paymentsTotal: 1000000 }, // Temmuz
      { previousBalance: 2330417, totalAmount: 1681264, paymentsTotal: 1500000 }, // Ağustos
    ];

    for (let i = 0; i < months.length - 1; i++) {
      const ending = computeEndingBalance(months[i].previousBalance, months[i].totalAmount, months[i].paymentsTotal);
      expect(ending).toBe(months[i + 1].previousBalance);
    }

    const lastEnding = computeEndingBalance(
      months[5].previousBalance,
      months[5].totalAmount,
      months[5].paymentsTotal,
    );
    expect(lastEnding).toBe(2511681);
  });
});
