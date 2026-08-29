import { describe, expect, it } from "vitest";
import { suggestLineClassification } from "@/lib/bank-account/classify";

const HOLDER = "Ahmet Yıldız";

describe("suggestLineClassification", () => {
  it("hesaptan çıkan HER hareketi Hariç Tut önerir (yalnızca gelir takip edilir)", () => {
    expect(suggestLineClassification("Giden Transfer, Zeynep Kaya, Bireysel Ödeme, EFT (FAST) sorgu no: 1", true, HOLDER)).toBe("EXCLUDED");
    expect(suggestLineClassification("Ödeme, Enpara.com kredi kartı ödemesi, Ahmet Yıldız", true, HOLDER)).toBe("EXCLUDED");
    expect(suggestLineClassification("Giden Transfer, Örnek Menkul Değerler Anonim Şirketi, 5R6MBWYZUL", true, HOLDER)).toBe("EXCLUDED");
    expect(suggestLineClassification("Encard Harcaması, 000000000000000-HEPSIPAY/HEPSIBURADA ISTANBUL TR Pos satış", true, HOLDER)).toBe("EXCLUDED");
    expect(suggestLineClassification("Para Çekme, QNB ATM'sinden para çekme", true, HOLDER)).toBe("EXCLUDED");
  });

  it("kendi hesabına GELEN transferi de Hariç Tut önerir (kendi paranızın taşınması, gerçek gelir değil)", () => {
    expect(suggestLineClassification("Gelen Transfer, AHMET YILDIZ, Bireysel Ödeme", false, HOLDER)).toBe("EXCLUDED");
  });

  it("büyük/küçük harf ve Türkçe İ farkını gözetmeksizin kendi hesabını tanır", () => {
    expect(suggestLineClassification("gelen transfer, ahmet yıldız, bireysel ödeme", false, HOLDER)).toBe("EXCLUDED");
  });

  it("başkasından gelen transferi Gelir önerir", () => {
    expect(suggestLineClassification("Gelen Transfer, CANER AYDIN, Kardeşime harçlık", false, HOLDER)).toBe("INCOME");
    expect(suggestLineClassification("Diğer, Ayin Enparalisi oldugunuz icin Netflix, Spotify ve Youtube Premium kampanyasindan kazandiginiz iade", false, HOLDER)).toBe("INCOME");
  });

  it("hesap sahibinin adı açıklamanın İÇİNDE ama gelen transferin karşı tarafı DEĞİLSE Gelir önerir (yanlış pozitif olmamalı)", () => {
    // "Ahmet Yıldız" burada EFT referans notunun bir parçası, karşı taraf "Örnek Eğitim..." şirketi.
    // (Gerçek veride bu satır Giden Transfer olduğu için zaten Hariç Tut olurdu, ama kural yön bağımsız test ediliyor.)
    const description =
      "Gelen Transfer, Örnek Eğitim Danışmanlık Denetim İletişim Org. Ve Sağlık Hiz. A. Ş., dae757ab64177 Ahmet Yıldız, EFT (FAST) sorgu no: 1";
    expect(suggestLineClassification(description, false, HOLDER)).toBe("INCOME");
  });

  it("hesap sahibi adı bilinmiyorsa (null) kendi-hesap kuralını atlar, yöne göre önerir", () => {
    expect(suggestLineClassification("Gelen Transfer, Ahmet Yıldız, Bireysel Ödeme", false, null)).toBe("INCOME");
  });
});
