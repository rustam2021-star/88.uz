import baseProducts from "../data/products.json" with { type: "json" };
import baseCategories from "../data/categories.json" with { type: "json" };
import basePosts from "../data/blog.json" with { type: "json" };
import productEn from "../data/i18n/products.en.json" with { type: "json" };
import productUz from "../data/i18n/products.uz.json" with { type: "json" };
import categoryEn from "../data/i18n/categories.en.json" with { type: "json" };
import categoryUz from "../data/i18n/categories.uz.json" with { type: "json" };
import blogEn from "../data/i18n/blog.en.json" with { type: "json" };
import blogUz from "../data/i18n/blog.uz.json" with { type: "json" };

const overlays = {
  en: { products: productEn, categories: categoryEn, posts: blogEn },
  uz: { products: productUz, categories: categoryUz, posts: blogUz }
};

function mergeCollection(items, translations, key = "slug") {
  if (!translations) return items;
  return items.map((item) => ({ ...item, ...(translations[item[key]] || {}) }));
}

export function getLocalizedProducts(locale = "ru") {
  return mergeCollection(baseProducts, overlays[locale]?.products);
}

export function getLocalizedCategories(locale = "ru") {
  return mergeCollection(baseCategories, overlays[locale]?.categories);
}

export function getLocalizedPosts(locale = "ru") {
  return mergeCollection(basePosts, overlays[locale]?.posts);
}

export { baseProducts, baseCategories, basePosts };
