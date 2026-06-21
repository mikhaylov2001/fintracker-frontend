import { DEFAULT_INCOME_CATEGORIES, buildCategoryList } from "./defaultCategories";
import { DEFAULT_INCOME_SOURCES, buildSourceList, canonicalSourceName } from "./defaultIncomeSources";

describe("income category list", () => {
  test("keeps default order", () => {
    expect(buildCategoryList("INCOME")).toEqual(DEFAULT_INCOME_CATEGORIES);
  });

  test("maps legacy rent category name", () => {
    expect(buildCategoryList("INCOME", ["Аренда недвижимости"])).toContain("Рента");
  });
});

describe("income source list", () => {
  test("keeps default order", () => {
    expect(buildSourceList()).toEqual(DEFAULT_INCOME_SOURCES);
  });

  test("maps legacy rent source name", () => {
    expect(canonicalSourceName("Аренда недвижимости")).toBe("Рента");
    expect(buildSourceList(["Аренда недвижимости"])).toContain("Рента");
  });
});
