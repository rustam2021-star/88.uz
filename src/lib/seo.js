import categories from "../data/categories.json" with { type: "json" };
import products from "../data/products.json" with { type: "json" };
import posts from "../data/blog.json" with { type: "json" };
import { blogSeo, catalogSeo, categorySeoConfig, homeSeo } from "../data/seo-config.js";

export const SITE_URL = "https://88.uz";
export const SITE_NAME = "88.uz";
export const DEFAULT_OG_IMAGE = "/assets/theme/assets/images/slider/slider-34.jpg";
export const ORGANIZATION_URL = `${SITE_URL}/#organization`;
export const WEBSITE_URL = `${SITE_URL}/#website`;

const NO_BRAND_PATTERN = /^(без бренда|без марки|нет бренда)$/iu;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
}

export function normalizePath(path = "/") {
  const pathname = String(path).split(/[?#]/, 1)[0] || "/";
  const normalized = `/${pathname.replace(/^\/+|\/+$/g, "")}/`;
  return normalized === "//" ? "/" : normalized;
}

export function getCanonicalUrl(path = "/") {
  return absoluteUrl(normalizePath(path));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value, maxLength = 155) {
  const text = clean(value);

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).replace(/\s+\S*$/, "")}…`;
}

export function getProductBrand(product) {
  const brand = clean(product?.brand);
  return brand && !NO_BRAND_PATTERN.test(brand) ? brand : "";
}

export function getProductSeo(product, category) {
  const brand = getProductBrand(product);
  const model = clean(product?.model);
  const exactName = clean(product?.title || model || "Товар");
  const modelQuery = model && model !== exactName ? `${brand ? `${brand} ` : ""}${model}` : "";
  const productTitle = modelQuery || exactName;
  const title = `${productTitle} — купить в Ташкенте | ${SITE_NAME}`;
  const fallbackDescription = `${exactName}. ${product.price ? `Цена: ${new Intl.NumberFormat("ru-RU").format(product.price)} сум. ` : ""}Наличие, комплектацию и способ получения уточняйте перед заказом в Ташкенте.`;
  const description = truncate(product.seo_description || fallbackDescription);
  const primaryKeyword = `купить ${exactName.toLocaleLowerCase("ru-RU")}`;
  const secondaryKeywords = unique([
    brand && `купить ${brand} ${model || exactName}`,
    model && `цена ${model}`,
    model && `характеристики ${model}`,
    `${exactName} цена в Ташкенте`
  ]).filter((keyword) => keyword.toLocaleLowerCase("ru-RU") !== primaryKeyword);

  return {
    url: `/product/${product.slug}/`,
    pageType: "product",
    searchIntent: "transactional",
    primaryKeyword,
    secondaryKeywords,
    entities: unique([brand, model, category?.title, product.condition, product.location]),
    title,
    description,
    h1: exactName,
    canonical: getCanonicalUrl(`/product/${product.slug}/`),
    robots: "index, follow",
    parentCategory: category ? `/${category.slug}/` : "",
    internalLinks: unique([
      category && `/${category.slug}/`,
      ...(product.related_products || []).map((slug) => `/product/${slug}/`)
    ])
  };
}

export function getCategorySeo(category) {
  const config = categorySeoConfig[category.slug] || {};
  const title = config.title || category.seo_title || `${category.title} — 88.uz`;
  const description = truncate(config.description || category.seo_description || category.description_top);

  return {
    url: `/${category.slug}/`,
    pageType: "category",
    searchIntent: "transactional",
    primaryKeyword: config.primaryKeyword || `${category.title.toLocaleLowerCase("ru-RU")} купить в Ташкенте`,
    secondaryKeywords: config.secondaryKeywords || [],
    entities: unique([category.title, ...(config.entities || []), "Ташкент"]),
    title,
    description,
    h1: category.title,
    canonical: getCanonicalUrl(`/${category.slug}/`),
    robots: "index, follow",
    parentCategory: "/catalog/",
    internalLinks: products
      .filter((product) => product.category_slug === category.slug)
      .map((product) => `/product/${product.slug}/`)
  };
}

export function getHomeSeo() {
  return {
    url: "/",
    pageType: "home",
    searchIntent: "commercial",
    ...homeSeo,
    title: "88.uz — измерительные приборы и товары в Ташкенте",
    description: "Каталог 88.uz в Ташкенте: измерительные приборы, детекторы, автоинструменты, электроника и оборудование. Выберите товар и уточните заказ у продавца.",
    h1: "Приборы и оборудование для точных задач",
    canonical: getCanonicalUrl("/"),
    robots: "index, follow",
    parentCategory: "",
    internalLinks: ["/catalog/", ...categories.map((category) => `/${category.slug}/`)]
  };
}

export function getCatalogSeo() {
  return {
    url: "/catalog/",
    pageType: "catalog",
    searchIntent: "commercial",
    ...catalogSeo,
    title: "Каталог товаров в Ташкенте — 88.uz",
    description: "Каталог 88.uz: измерительные приборы, детекторы, автоинструменты, электроника, оборудование и товары для дома с заказом в Ташкенте.",
    h1: "Каталог товаров",
    canonical: getCanonicalUrl("/catalog/"),
    robots: "index, follow",
    parentCategory: "",
    internalLinks: categories.map((category) => `/${category.slug}/`)
  };
}

export function getBlogIndexSeo() {
  return {
    url: "/blog/",
    pageType: "blog",
    searchIntent: "informational",
    ...blogSeo,
    title: "Блог 88.uz — выбор приборов и инструментов",
    description: "Практические статьи 88.uz о выборе измерительных приборов, детекторов, автоинструментов и оборудования.",
    h1: "Блог",
    canonical: getCanonicalUrl("/blog/"),
    robots: "index, follow",
    parentCategory: "",
    internalLinks: posts.map((post) => `/blog/${post.slug}/`)
  };
}

export function getBlogPostSeo(post) {
  const title = `${post.title} — блог 88.uz`;

  return {
    url: `/blog/${post.slug}/`,
    pageType: "article",
    searchIntent: "informational",
    primaryKeyword: post.title.toLocaleLowerCase("ru-RU"),
    secondaryKeywords: unique([post.category, post.excerpt]),
    entities: unique([post.category, post.product_slug && products.find((product) => product.slug === post.product_slug)?.title]),
    title,
    description: truncate(post.excerpt),
    h1: post.title,
    canonical: getCanonicalUrl(`/blog/${post.slug}/`),
    robots: "index, follow",
    parentCategory: "/blog/",
    internalLinks: unique(["/blog/", post.product_slug && `/product/${post.product_slug}/`])
  };
}

function createPageEntry(seo) {
  return {
    url: seo.url,
    pageType: seo.pageType,
    searchIntent: seo.searchIntent,
    primaryKeyword: seo.primaryKeyword,
    secondaryKeywords: seo.secondaryKeywords,
    entities: seo.entities,
    title: seo.title,
    description: seo.description,
    h1: seo.h1,
    canonical: seo.canonical,
    robots: seo.robots,
    parentCategory: seo.parentCategory,
    internalLinks: seo.internalLinks
  };
}

export function createSeoMap() {
  return [
    getHomeSeo(),
    getCatalogSeo(),
    ...categories.map((category) => getCategorySeo(category)),
    ...products.map((product) => getProductSeo(product, categories.find((category) => category.slug === product.category_slug))),
    getBlogIndexSeo(),
    ...posts.map(getBlogPostSeo)
  ].map(createPageEntry);
}

export const seoMap = createSeoMap();

export function getOrganizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_URL,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/assets/theme/assets/images/logo/logo.svg"),
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+998977334483",
      contactType: "customer service",
      areaServed: "UZ"
    }
  };
}

export function getWebsiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_URL,
    name: SITE_NAME,
    url: SITE_URL,
    publisher: { "@id": ORGANIZATION_URL }
  };
}

export function getBreadcrumbSchema(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url)
    }))
  };
}

export function getBreadcrumbItems(items) {
  return items.map((item) => ({ ...item, url: normalizePath(item.url) }));
}

export function getCollectionSchema({ name, url, products: items = [] }) {
  return {
    "@type": "CollectionPage",
    name,
    url: getCanonicalUrl(url),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/product/${product.slug}/`),
        name: product.title,
        image: absoluteUrl(product.main_image)
      }))
    }
  };
}

export function getProductSchema(product, category) {
  const seo = getProductSeo(product, category);
  const image = (product.gallery?.length ? product.gallery : [product.main_image]).filter(Boolean).map(absoluteUrl);
  const schema = {
    "@type": "Product",
    name: product.title,
    url: seo.canonical,
    image,
    description: clean(product.description || product.short_description),
    sku: clean(product.source_id || product.id),
    category: category?.title
  };
  const brand = getProductBrand(product);

  if (brand) {
    schema.brand = { "@type": "Brand", name: brand };
  }

  if (Number.isFinite(Number(product.price)) && Number(product.price) > 0) {
    schema.offers = {
      "@type": "Offer",
      url: seo.canonical,
      priceCurrency: product.currency || "UZS",
      price: Number(product.price),
      availability: `${"https://schema.org/"}${product.in_stock ? "InStock" : "OutOfStock"}`
    };
  }

  return schema;
}

export function getPageSchema({ seo, breadcrumbs, pageSchema }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebPage", "@id": `${seo.canonical}#webpage`, url: seo.canonical, name: seo.title, description: seo.description },
      getOrganizationSchema(),
      getWebsiteSchema(),
      getBreadcrumbSchema(breadcrumbs),
      ...(pageSchema ? [pageSchema] : [])
    ]
  };
}
