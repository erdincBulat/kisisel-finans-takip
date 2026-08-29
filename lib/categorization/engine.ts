import type { Category, MerchantRule } from "@prisma/client";
import { listCategoryTree } from "@/lib/db/category.service";
import { listMerchantRules } from "@/lib/merchants/merchant-rule.service";
import { normalizeMerchant, stripKnownPrefixes } from "@/lib/merchants/normalize";
import { findKnownMerchant } from "@/lib/merchants/known-merchants";
import { matchFold } from "@/lib/merchants/text";
import { matchPatternRule } from "./pattern-rules";

type CategoryWithChildren = Category & { children: Category[] };

export type CategorySuggestionSource = "MERCHANT_RULE" | "KNOWN_MERCHANT" | "PATTERN";

export type CategorySuggestion = {
  categoryId: string;
  subCategoryId: string | null;
  source: CategorySuggestionSource;
};

export type CategorizationContext = {
  rules: MerchantRule[];
  categoryTree: CategoryWithChildren[];
};

export type CategorizationInput = {
  description: string;
  isBankFee?: boolean;
};

/** İsimle verilen kategori/alt kategoriyi gerçek seed ağacında bulur; kullanıcı yeniden adlandırmış/silmişse sessizce null döner. */
export function resolveCategoryByName(
  categoryTree: CategoryWithChildren[],
  categoryName: string,
  subCategoryName?: string,
): { categoryId: string; subCategoryId: string | null } | null {
  const parent = categoryTree.find((c) => c.name === categoryName);
  if (!parent) return null;
  if (!subCategoryName) return { categoryId: parent.id, subCategoryId: null };

  const child = parent.children.find((c) => c.name === subCategoryName);
  return { categoryId: parent.id, subCategoryId: child?.id ?? null };
}

/** Bir normalizedMerchant'a uyan ilk MerchantRule'u bulur (spec §12 adım 2). */
export function matchMerchantRule(rules: MerchantRule[], normalizedMerchant: string): MerchantRule | null {
  const haystack = matchFold(normalizedMerchant);
  return rules.find((rule) => haystack.includes(matchFold(rule.merchantPattern))) ?? null;
}

/**
 * Kategori belirleme öncelik zinciri (spec §12): manuel kullanıcı seçimi bu
 * fonksiyonun dışındadır (çağıran taraf zaten bilinen bir kategoriyi asla bu
 * fonksiyona sormamalı) — burada MerchantRule > bilinen merchant > pattern
 * matching sırasıyla denenir. AI adımı (§12 adım 5) kasıtlı olarak atlanıyor:
 * `lib/ai/` henüz yok (Faz 12), hiçbiri eşleşmezse `null` döner ("Kategori
 * seçilmedi" — spec §19, tier 6).
 */
export function suggestCategory(input: CategorizationInput, context: CategorizationContext): CategorySuggestion | null {
  const stripped = stripKnownPrefixes(input.description);
  const normalizedMerchant = normalizeMerchant(input.description);

  const rule = matchMerchantRule(context.rules, normalizedMerchant);
  if (rule) {
    return { categoryId: rule.categoryId, subCategoryId: rule.subCategoryId, source: "MERCHANT_RULE" };
  }

  const known = findKnownMerchant(stripped);
  if (known?.categoryName) {
    const resolved = resolveCategoryByName(context.categoryTree, known.categoryName, known.subCategoryName);
    if (resolved) return { ...resolved, source: "KNOWN_MERCHANT" };
  }

  const pattern = matchPatternRule(stripped, input.isBankFee ?? false);
  if (pattern) {
    const resolved = resolveCategoryByName(context.categoryTree, pattern.categoryName, pattern.subCategoryName);
    if (resolved) return { ...resolved, source: "PATTERN" };
  }

  return null;
}

/** MerchantRule listesi + kategori ağacını bir kez çeker, sonra tüm işlemler için senkron eşleştirme yapar (N+1 sorgu yerine). */
export async function suggestCategoriesForTransactions(
  transactions: CategorizationInput[],
): Promise<(CategorySuggestion | null)[]> {
  const [rules, categoryTree] = await Promise.all([listMerchantRules(), listCategoryTree()]);
  const context: CategorizationContext = { rules, categoryTree };
  return transactions.map((t) => suggestCategory(t, context));
}
