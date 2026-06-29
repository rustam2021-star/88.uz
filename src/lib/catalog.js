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

export function getOrderUrl(product) {
  const text = product?.title
    ? `Здравствуйте! Хочу заказать: ${product.title}`
    : "Здравствуйте! Хочу заказать товар с сайта 88.uz";

  return `${ORDER_URL}?text=${encodeURIComponent(text)}`;
}

export function getProductsByCategory(products, categorySlug) {
  return products.filter((product) => product.category_slug === categorySlug);
}
