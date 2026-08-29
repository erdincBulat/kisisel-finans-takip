import { PDFParse } from "pdf-parse";

/**
 * PDF'den düz metin çıkarır. pdf-parse'ın page-order text çıktısını kullanır
 * (satır bazlı regex parsing için yeterli — bkz. parse-statement.ts).
 *
 * Kütüphane değişimi ihtimaline karşı (örn. koordinat-bazlı çıkarıma geçiş)
 * bu dosya dışında hiçbir yerin pdf-parse'a doğrudan bağımlı olmaması hedeflenir.
 */
export async function extractPdfText(pdfBuffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: pdfBuffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}
