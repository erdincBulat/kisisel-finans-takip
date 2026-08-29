import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseAccountLines,
  parseEnparaAccountStatementText,
  extractAccountHolderName,
  extractStatementDate,
} from "@/lib/bank-account/parse-account-statement";
import { validateParsedAccountStatement } from "@/lib/bank-account/validate";

function loadFixture(name: string): string {
  return readFileSync(join(import.meta.dirname, "fixtures", name), "utf-8");
}

describe("parseAccountLines", () => {
  it("tek satırlık bir işlemi doğru ayrıştırır", () => {
    const text = "01/03/26 Gelen Transfer, AHMET YILDIZ, Bireysel Ödeme 8.000,00 TL 23.255,83 TL";
    const [line] = parseAccountLines(text);
    expect(line).toEqual({
      date: new Date(Date.UTC(2026, 2, 1)),
      description: "Gelen Transfer, AHMET YILDIZ, Bireysel Ödeme",
      amount: 800000,
      isOutgoing: false,
      balanceAfter: 2325583,
    });
  });

  it("iki satıra yayılmış bir işlemi (tutar+bakiye son satıra eklenmiş) birleştirir", () => {
    const text = [
      "02/03/26 Giden Transfer, Zeynep Kaya, Bireysel Ödeme, EFT (FAST)",
      "sorgu no: 4344466477 - 2.000,00 TL 21.255,83 TL",
    ].join("\n");
    const [line] = parseAccountLines(text);
    expect(line.description).toBe("Giden Transfer, Zeynep Kaya, Bireysel Ödeme, EFT (FAST) sorgu no: 4344466477");
    expect(line.amount).toBe(200000);
    expect(line.isOutgoing).toBe(true);
    expect(line.balanceAfter).toBe(2125583);
  });

  it("dört satıra yayılmış, tutar+bakiyenin TAMAMEN kendi satırında olduğu bir işlemi doğru ayrıştırır", () => {
    // Gerçek veriden (Mart 2026 hesap özeti) — en karmaşık örnek.
    const text = [
      "22/03/26 Giden Transfer, Örnek Eğitim Danışmanlık Denetim İletişim",
      "Org. Ve Sağlık Hiz. A. Ş., dae757ab64177 Ahmet Yıldız,",
      "EFT (FAST) sorgu no: 4394865715",
      "- 3.192,00 TL 22.168,82 TL",
    ].join("\n");
    const [line] = parseAccountLines(text);
    expect(line.description).toBe(
      "Giden Transfer, Örnek Eğitim Danışmanlık Denetim İletişim Org. Ve Sağlık Hiz. A. Ş., dae757ab64177 Ahmet Yıldız, EFT (FAST) sorgu no: 4394865715",
    );
    expect(line.amount).toBe(319200);
    expect(line.isOutgoing).toBe(true);
  });

  it("sayfa altbilgisi/ayırıcı/tekrarlanan başlık satırlarını yok sayar", () => {
    const text = [
      "20/03/26 Gelen Transfer, KEREM POLAT, Bireysel Ödeme 10.000,00 TL 26.860,82 TL",
      "2	1	Sayfa /",
      "Enpara Bank A.Ş. Büyük Mükellefler V.D. 3350917589",
      "-- 1 of 2 --",
      "Tarih Açıklama Tutar Bakiye",
      "22/03/26 Giden Transfer, Caner Aydın, Bireysel Ödeme, EFT",
      "(FAST) sorgu no: 4394816206 - 1.500,00 TL 25.360,82 TL",
    ].join("\n");
    const lines = parseAccountLines(text);
    expect(lines).toHaveLength(2);
    expect(lines[1].description).toBe("Giden Transfer, Caner Aydın, Bireysel Ödeme, EFT (FAST) sorgu no: 4394816206");
  });

  it("iki haneli yılı 2000'li yıllara doğru çözer", () => {
    const [line] = parseAccountLines("15/07/26 Para Çekme, QNB ATM'sinden para çekme - 1.000,00 TL 5.475,82 TL");
    expect(line.date.getUTCFullYear()).toBe(2026);
  });
});

describe("extractAccountHolderName / extractStatementDate", () => {
  const text = loadFixture("enpara-account-2026-03-real.txt");

  it("hesap sahibinin adını çıkarır", () => {
    expect(extractAccountHolderName(text)).toBe("Ahmet Yıldız");
  });

  it("ekstre tarihini ('gün sonu itibarıyla') çıkarır", () => {
    expect(extractStatementDate(text)).toEqual(new Date(Date.UTC(2026, 2, 31)));
  });
});

describe("parseEnparaAccountStatementText — gerçek hesap özeti fixture'ları", () => {
  it.each(["enpara-account-2026-03-real.txt", "enpara-account-2026-07-real.txt"])(
    "%s: bakiye zinciri sıfır uyarıyla doğrulanır",
    (fixtureName) => {
      const text = loadFixture(fixtureName);
      const parsed = parseEnparaAccountStatementText(text);
      const validation = validateParsedAccountStatement(parsed);

      expect(parsed.lines.length).toBeGreaterThan(0);
      expect(validation.warnings).toEqual([]);
    },
  );

  it("Mart 2026: dönem/IBAN/bakiye alanlarını doğru çıkarır", () => {
    const parsed = parseEnparaAccountStatementText(loadFixture("enpara-account-2026-03-real.txt"));
    expect(parsed.year).toBe(2026);
    expect(parsed.month).toBe(3);
    expect(parsed.iban).toBe("TR123456789012345678901234");
    expect(parsed.openingBalance).toBe(1525583);
    expect(parsed.closingBalance).toBe(2016882);
    expect(parsed.periodStart).toEqual(new Date(Date.UTC(2026, 2, 1)));
    expect(parsed.periodEnd).toEqual(new Date(Date.UTC(2026, 2, 31)));
  });

  it("Temmuz 2026: hesaptan çıkan HER hareketi (Encard harcaması, Para Çekme, Giden Transfer) Hariç Tut önerir", () => {
    const parsed = parseEnparaAccountStatementText(loadFixture("enpara-account-2026-07-real.txt"));
    const outgoingLines = parsed.lines.filter((l) => l.isOutgoing);

    expect(outgoingLines.length).toBeGreaterThan(0);
    expect(outgoingLines.every((l) => l.suggestedClassification === "EXCLUDED")).toBe(true);
  });

  it("kendi hesabına gelen transferi Hariç Tut, başkasından geleni Gelir olarak önerir", () => {
    const parsed = parseEnparaAccountStatementText(loadFixture("enpara-account-2026-03-real.txt"));
    const selfTransfer = parsed.lines.find((l) => l.description.startsWith("Gelen Transfer, AHMET YILDIZ"));
    const fromSomeoneElse = parsed.lines.find((l) => l.description.startsWith("Gelen Transfer, CANER AYDIN"));

    expect(selfTransfer?.suggestedClassification).toBe("EXCLUDED");
    expect(fromSomeoneElse?.suggestedClassification).toBe("INCOME");
  });
});
