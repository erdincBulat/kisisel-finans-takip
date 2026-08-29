import { describe, expect, it } from "vitest";
import type { Category, MerchantRule } from "@prisma/client";
import {
  resolveCategoryByName,
  matchMerchantRule,
  suggestCategory,
  type CategorizationContext,
} from "@/lib/categorization/engine";

function makeCategory(overrides: Partial<Category> & { id: string; name: string }): Category {
  return {
    color: "#000000",
    isIncome: false,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as Category;
}

// prisma/seed.ts'deki gerçek kategori ağacının küçültülmüş bir aynası.
const CATEGORY_TREE = [
  {
    ...makeCategory({ id: "cat-gunluk", name: "Günlük Yaşam" }),
    children: [
      makeCategory({ id: "sub-market", name: "Market", parentId: "cat-gunluk" }),
      makeCategory({ id: "sub-yemek", name: "Yemek", parentId: "cat-gunluk" }),
    ],
  },
  {
    ...makeCategory({ id: "cat-teknoloji", name: "Teknoloji" }),
    children: [
      makeCategory({ id: "sub-ai", name: "AI", parentId: "cat-teknoloji" }),
      makeCategory({ id: "sub-hosting", name: "Hosting", parentId: "cat-teknoloji" }),
    ],
  },
  {
    ...makeCategory({ id: "cat-finans", name: "Finans" }),
    children: [makeCategory({ id: "sub-bankacilik", name: "Bankacılık", parentId: "cat-finans" })],
  },
];

function makeRule(overrides: Partial<MerchantRule> & { merchantPattern: string; categoryId: string }): MerchantRule {
  return {
    id: "rule-1",
    normalizedMerchant: overrides.merchantPattern,
    subCategoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as MerchantRule;
}

describe("resolveCategoryByName", () => {
  it("var olan kategori/alt kategoriyi bulur", () => {
    expect(resolveCategoryByName(CATEGORY_TREE, "Teknoloji", "AI")).toEqual({
      categoryId: "cat-teknoloji",
      subCategoryId: "sub-ai",
    });
  });

  it("alt kategori verilmezse sadece ana kategoriyi döner", () => {
    expect(resolveCategoryByName(CATEGORY_TREE, "Finans")).toEqual({ categoryId: "cat-finans", subCategoryId: null });
  });

  it("kategori adı bulunamazsa (kullanıcı yeniden adlandırmış/silmiş olabilir) null döner, çökmez", () => {
    expect(resolveCategoryByName(CATEGORY_TREE, "Olmayan Kategori")).toBeNull();
  });

  it("alt kategori adı bulunamazsa ana kategoriyi subCategoryId:null ile döner", () => {
    expect(resolveCategoryByName(CATEGORY_TREE, "Teknoloji", "Olmayan Alt")).toEqual({
      categoryId: "cat-teknoloji",
      subCategoryId: null,
    });
  });
});

describe("matchMerchantRule", () => {
  it("normalizedMerchant, pattern'i içeriyorsa eşleşir (case-insensitive)", () => {
    const rules = [makeRule({ merchantPattern: "amazon", categoryId: "cat-teknoloji" })];
    expect(matchMerchantRule(rules, "Amazon")?.categoryId).toBe("cat-teknoloji");
  });

  it("eşleşme yoksa null döner", () => {
    const rules = [makeRule({ merchantPattern: "amazon", categoryId: "cat-teknoloji" })];
    expect(matchMerchantRule(rules, "Migros")).toBeNull();
  });
});

describe("suggestCategory — öncelik zinciri (spec §12)", () => {
  it("MerchantRule varsa, bilinen merchant/pattern eşleşmesi olsa bile ONU kullanır", () => {
    // "Google One" normalde Teknoloji/Dijital Hizmetler önerir (bilinen merchant),
    // ama kullanıcı bunun için manuel bir MerchantRule oluşturmuş olsun.
    const context: CategorizationContext = {
      rules: [makeRule({ merchantPattern: "google one", categoryId: "sub-ai", subCategoryId: null })],
      categoryTree: CATEGORY_TREE,
    };
    const result = suggestCategory({ description: "GOOGLE *Google One" }, context);
    expect(result).toEqual({ categoryId: "sub-ai", subCategoryId: null, source: "MERCHANT_RULE" });
  });

  it("MerchantRule yoksa bilinen merchant tablosuna düşer", () => {
    const context: CategorizationContext = { rules: [], categoryTree: CATEGORY_TREE };
    const result = suggestCategory({ description: "GOOGLE *Google One" }, context);
    expect(result).toEqual({ categoryId: "cat-teknoloji", subCategoryId: null, source: "KNOWN_MERCHANT" });
  });

  it("ne MerchantRule ne bilinen merchant varsa pattern matching'e düşer", () => {
    const context: CategorizationContext = { rules: [], categoryTree: CATEGORY_TREE };
    const result = suggestCategory({ description: "MERVE MARKET" }, context);
    expect(result).toEqual({ categoryId: "cat-gunluk", subCategoryId: "sub-market", source: "PATTERN" });
  });

  it("hiçbiri eşleşmezse null döner (spec §19: 'Kategori seçilmedi')", () => {
    const context: CategorizationContext = { rules: [], categoryTree: CATEGORY_TREE };
    expect(suggestCategory({ description: "AYŞE DEMİR" }, context)).toBeNull();
  });

  it("bilinen merchant kategori önermiyorsa (ör. geniş e-ticaret) pattern'e devam eder", () => {
    const context: CategorizationContext = { rules: [], categoryTree: CATEGORY_TREE };
    // Trendyol.com kategorisiz bilinen merchant — market/yemek/vb kelime içermiyor, sonuç null olmalı.
    expect(suggestCategory({ description: "TRENDYOL.COM ISTANBUL TR" }, context)).toBeNull();
  });

  it("isBankFee true ise Finans/Bankacılık'a atar", () => {
    const context: CategorizationContext = { rules: [], categoryTree: CATEGORY_TREE };
    const result = suggestCategory({ description: "Alışveriş faizi", isBankFee: true }, context);
    expect(result).toEqual({ categoryId: "cat-finans", subCategoryId: "sub-bankacilik", source: "PATTERN" });
  });

  it("önerilen kategori kullanıcı tarafından yeniden adlandırılmış/silinmişse çökmeden null döner", () => {
    const treeWithoutFinans = CATEGORY_TREE.filter((c) => c.name !== "Finans");
    const context: CategorizationContext = { rules: [], categoryTree: treeWithoutFinans };
    expect(suggestCategory({ description: "Motorlu Taşıtlar Vergisi - Tahsilatı" }, context)).toBeNull();
  });
});
