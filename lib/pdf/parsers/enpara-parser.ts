import { extractPdfText } from "../extract-text";
import { parseEnparaStatementText } from "../parse-statement";
import type { ParsedStatement, StatementParser } from "../types";

export const EnparaParser: StatementParser = {
  canParse(text: string): boolean {
    return /enpara/i.test(text) && /Ekstre tarihi/i.test(text);
  },

  async parse(pdfBuffer: Buffer): Promise<ParsedStatement> {
    const text = await extractPdfText(pdfBuffer);
    if (!EnparaParser.canParse(text)) {
      throw new Error("Bu PDF bir Enpara kredi kartı ekstresi gibi görünmüyor.");
    }
    return parseEnparaStatementText(text);
  },
};
