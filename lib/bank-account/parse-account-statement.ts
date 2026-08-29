import { parseTLToKurus } from "@/lib/money";
import { suggestLineClassification } from "./classify";
import type { ParsedAccountLine, ParsedAccountStatement } from "./types";

const AMOUNT_TOKEN = "\\d{1,3}(?:\\.\\d{3})*,\\d{2}";

/** Bir işlemin başlangıcı: "GG/AA/YY <açıklamanın devamı>" — hesap özetinde yıl İKİ hane (kredi kartı ekstresinden farklı). */
const LINE_START = /^(\d{2})\/(\d{2})\/(\d{2})\s+(.*)$/;

/** Bir satırın SONUNDA "[- ]tutar TL bakiye TL" — açıklama 1-3 fiziksel satıra yayılabilir, bu kalıp o bloğun bittiğini gösterir. */
const TRAILING_AMOUNT = new RegExp(`(-\\s*)?(${AMOUNT_TOKEN})\\s*TL\\s+(${AMOUNT_TOKEN})\\s*TL\\s*$`);

/** Sayfa başlığı/altbilgi/ayırıcı gürültü satırları — hiçbir işlemin parçası değildir. */
const NOISE_LINE = /^(Enpara Bank|--\s*\d+ of \d+\s*--$|Tarih\s+Açıklama\s+Tutar\s+Bakiye$|\d+\s+\d+\s+Sayfa\s*\/\s*$)/;

function toDate2(day: string, month: string, year2: string): Date {
  return new Date(Date.UTC(2000 + Number(year2), Number(month) - 1, Number(day)));
}

type RawLine = Omit<ParsedAccountLine, "suggestedClassification">;

/**
 * Ham metindeki işlem satırlarını ayrıştırır. Her işlem 1-3 fiziksel satıra
 * yayılabilir (açıklama uzunsa sarılıyor) ve tutar+bakiye çifti ya son
 * açıklama satırına eklenmiş ya da tamamen kendi satırında olabilir — bkz.
 * gerçek 6 aylık veriden doğrulanan örnekler (tests/bank-account/fixtures/).
 */
export function parseAccountLines(text: string): RawLine[] {
  const lines: RawLine[] = [];
  let current: { date: Date; descParts: string[] } | null = null;

  function closeWith(segment: string): boolean {
    if (!current) return false;
    const match = TRAILING_AMOUNT.exec(segment);
    if (!match) return false;

    const before = segment.slice(0, match.index).trim();
    if (before) current.descParts.push(before);

    const isOutgoing = Boolean(match[1]);
    const amount = parseTLToKurus(match[2]);
    const balanceAfter = parseTLToKurus(match[3]);
    const description = current.descParts.join(" ").replace(/\s+/g, " ").trim();

    lines.push({ date: current.date, description, amount, isOutgoing, balanceAfter });
    current = null;
    return true;
  }

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || NOISE_LINE.test(line)) continue;

    const startMatch = LINE_START.exec(line);
    if (startMatch) {
      // Önceki blok tutarını hiç bulamadan yeni bir işlem başlıyorsa (anomali),
      // yarım kalan bloğu sessizce bırakıp yeni işlemle devam edilir.
      current = { date: toDate2(startMatch[1], startMatch[2], startMatch[3]), descParts: [] };
      if (!closeWith(startMatch[4]) && startMatch[4].trim()) {
        current.descParts.push(startMatch[4].trim());
      }
      continue;
    }

    if (current && !closeWith(line)) {
      current.descParts.push(line);
    }
  }

  return lines;
}

export function extractAccountHolderName(text: string): string | null {
  const match = text.match(/Ad soyad\s+([^\t\n]+)/);
  return match ? match[1].trim() : null;
}

export function extractStatementDate(text: string): Date | null {
  const match = text.match(/(\d{2})\/(\d{2})\/(\d{4})\s+gün sonu itibarıyla/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1])));
}

type PeriodInfo = {
  iban: string | null;
  closingBalance: number;
  openingBalance: number;
  periodStart: Date;
  periodEnd: Date;
};

/**
 * "Dönem sonu bakiyesi" bloğu — IBAN, dönem sonu/başı bakiyesi ve ekstre
 * dönemi (GG/AA/YYYY - GG/AA/YYYY) hep bu sırada, birbirini izleyen 3 satırda
 * çıkıyor (6 aylık gerçek veride doğrulandı — başlık tablosunun geri kalanı
 * pdf-parse'ta sütunlar birbirine karışacak kadar dağınık, ama bu blok
 * tutarlı kalıyor).
 */
function extractPeriodInfo(text: string): PeriodInfo | null {
  const ibanPattern = "TR\\d{2}(?:\\s?\\d{4}){5}\\s?\\d{2}";
  const amount = `(${AMOUNT_TOKEN})\\s*TL`;
  const datePattern = "(\\d{2}/\\d{2}/\\d{4})";

  const re = new RegExp(
    `Dönem sonu bakiyesi\\s+(${ibanPattern})\\s+${amount}\\s*\\n\\s*${amount}\\s*\\n\\s*${datePattern}\\s*-\\s*${datePattern}`,
  );
  const match = text.match(re);
  if (!match) return null;

  const [, iban, closingRaw, openingRaw, startRaw, endRaw] = match;
  const [sd, sm, sy] = startRaw.split("/").map(Number);
  const [ed, em, ey] = endRaw.split("/").map(Number);

  return {
    iban: iban.replace(/\s/g, ""),
    closingBalance: parseTLToKurus(closingRaw),
    openingBalance: parseTLToKurus(openingRaw),
    periodStart: new Date(Date.UTC(sy, sm - 1, sd)),
    periodEnd: new Date(Date.UTC(ey, em - 1, ed)),
  };
}

/** Enpara vadesiz TL hesap özeti metnini tam bir ParsedAccountStatement'a çevirir. */
export function parseEnparaAccountStatementText(text: string): ParsedAccountStatement {
  const statementDate = extractStatementDate(text);
  if (!statementDate) {
    throw new Error("Ekstre tarihi bulunamadı — bu dosya geçerli bir Enpara hesap özeti olmayabilir.");
  }

  const period = extractPeriodInfo(text);
  if (!period) {
    throw new Error("Dönem/bakiye bilgisi bulunamadı — bu dosya geçerli bir Enpara hesap özeti olmayabilir.");
  }

  const accountHolderName = extractAccountHolderName(text);
  const rawLines = parseAccountLines(text);
  const lines: ParsedAccountLine[] = rawLines.map((line) => ({
    ...line,
    suggestedClassification: suggestLineClassification(line.description, line.isOutgoing, accountHolderName),
  }));

  return {
    statementDate,
    accountHolderName,
    iban: period.iban,
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    year: statementDate.getUTCFullYear(),
    month: statementDate.getUTCMonth() + 1,
    openingBalance: period.openingBalance,
    closingBalance: period.closingBalance,
    lines,
  };
}
