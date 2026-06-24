import categories from "../data/categories.json";
import products from "../data/products.json";

export const site = {
  name: "88.uz",
  legalName: 'YaTT "Saidov Rakhmonbek"',
  title: "88.uz — приборы, гаджеты и инструменты с доставкой по Ташкенту",
  description:
    "Онлайн-каталог мультиметров, лазерных уровней, дальномеров, толщиномеров, pH/TDS-метров, аксессуаров Karcher и технических товаров для мастеров. Заказ онлайн и доставка прямо сейчас по г. Ташкент.",
  url: "https://88.uz",
  phone: "+998 97 733 44 83",
  telegramUsername: "Senditme",
  telegram: "https://t.me/Senditme",
  city: "Ташкент"
};

export function getCategories() {
  return categories;
}

export function getProducts() {
  return products;
}

export function getCategory(slug) {
  return categories.find((category) => category.slug === slug);
}

export function getProduct(slug) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(slug) {
  return products.filter((product) => product.category_slug === slug);
}

export function getRelatedProducts(product, limit = 4) {
  if (product.related_products?.length) {
    const related = product.related_products
      .map((slug) => getProduct(slug))
      .filter(Boolean)
      .slice(0, limit);

    if (related.length) {
      return related;
    }
  }

  return products
    .filter((item) => item.slug !== product.slug && item.category_slug === product.category_slug)
    .slice(0, limit);
}

export function formatPrice(product) {
  if (!product.price) {
    return "Цена по запросу";
  }

  return new Intl.NumberFormat("ru-RU").format(product.price) + " " + product.currency;
}

export function absoluteUrl(path = "/") {
  return new URL(path, site.url).toString();
}

export function categoryUrl(category) {
  return `/${category.slug}/`;
}

export function productUrl(product) {
  return `/product/${product.slug}/`;
}

export function telegramOrderText(product) {
  if (!product) {
    return "Здравствуйте! Хочу уточнить наличие и оформить заказ на 88.uz.";
  }

  return [
    "Здравствуйте! Хочу заказать товар с 88.uz.",
    "",
    `Товар: ${product.title}`,
    product.brand ? `Бренд: ${product.brand}` : "",
    product.model ? `Модель: ${product.model}` : "",
    product.price ? `Цена на сайте: ${formatPrice(product)}` : "",
    `Ссылка: ${absoluteUrl(productUrl(product))}`,
    "",
    "Подскажите, пожалуйста, есть ли в наличии и когда возможна доставка по Ташкенту?"
  ].filter(Boolean).join("\n");
}

export function telegramOrderUrl(product) {
  const text = encodeURIComponent(telegramOrderText(product));
  return `https://t.me/${site.telegramUsername}?text=${text}`;
}

export function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href)
    }))
  };
}

export function buildProductSchema(product, category) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.short_description,
    brand: {
      "@type": "Brand",
      name: product.brand
    },
    model: product.model,
    category: category?.title,
    image: absoluteUrl(product.main_image),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(productUrl(product)),
      priceCurrency: product.currency,
      price: product.price,
      availability: product.in_stock
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder",
      seller: {
        "@type": "Organization",
        name: site.name,
        legalName: site.legalName
      }
    }
  };
}

export function buildCollectionSchema(category, categoryProducts) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.h1,
    description: category.seo_description,
    url: absoluteUrl(categoryUrl(category)),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: categoryProducts.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(productUrl(product)),
        name: product.title
      }))
    }
  };
}
