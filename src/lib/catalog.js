export const CATALOG_URL = "/catalog/";
export const BLOG_URL = "/blog/";
export const ORDER_URL = "https://t.me/Senditme";
export const STORE_PHONE = "+998977334483";
export const FALLBACK_PRODUCT_IMAGE = "/assets/theme/assets/images/product/electronics/product-1.jpg";

export function formatPrice(value, currency = "UZS") {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    return "Цена по запросу";
  }

  if (currency === "UZS") {
    return `${amount.toLocaleString("ru-RU")} сум`;
  }

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency
  }).format(amount);
}

export function getProductUrl(product) {
  return `/product/${product.slug}/`;
}

export function getProductImage(product) {
  return product?.main_image || FALLBACK_PRODUCT_IMAGE;
}

export function getProductHoverImage(product) {
  return product?.hover_image || getProductImage(product);
}

export function getImageVariant(src, width) {
  if (!src || !width || /^https?:\/\//i.test(src) || src.includes("/optimized/")) {
    return src;
  }

  const queryIndex = src.indexOf("?");
  const cleanSrc = queryIndex >= 0 ? src.slice(0, queryIndex) : src;
  const slashIndex = cleanSrc.lastIndexOf("/");
  const dotIndex = cleanSrc.lastIndexOf(".");

  if (slashIndex < 0 || dotIndex <= slashIndex) {
    return src;
  }

  return `${cleanSrc.slice(0, slashIndex + 1)}optimized/${cleanSrc.slice(slashIndex + 1, dotIndex)}-${width}.webp`;
}

export function getImageSrcset(src, widths) {
  if (!src || !Array.isArray(widths)) {
    return "";
  }

  return widths.map((width) => `${getImageVariant(src, width)} ${width}w`).join(", ");
}

export function getProductCardImage(product, width = 330) {
  return getImageVariant(getProductImage(product), width);
}

export function getProductCardSrcset(product) {
  return getImageSrcset(getProductImage(product), [220, 330, 440]);
}

export function getProductHoverCardImage(product, width = 330) {
  return getImageVariant(getProductHoverImage(product), width);
}

export function getProductHoverCardSrcset(product) {
  return getImageSrcset(getProductHoverImage(product), [220, 330, 440]);
}

export function getOrderUrl(product) {
  const text = product?.title
    ? `Здравствуйте! Хочу заказать: ${product.title}`
    : "Здравствуйте! Хочу заказать товар с сайта 88.uz";

  return `${ORDER_URL}?text=${encodeURIComponent(text)}`;
}

export function getProductsByCategory(products, categorySlug) {
  return products.filter((product) => product.category_slug === categorySlug);
}
