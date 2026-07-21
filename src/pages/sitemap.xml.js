import products from "../data/products.json";
import categories from "../data/categories.json";
import posts from "../data/blog.json";

const SITE = "https://88.uz";
const LOCALES = ["ru", "uz", "en"];

const staticPages = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/catalog/", changefreq: "daily", priority: "0.9" },
  { path: "/blog/", changefreq: "weekly", priority: "0.7" }
];

const escapeXml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const createUrl = ({ path, changefreq = "weekly", priority = "0.6" }, locale) => ({
  path,
  locale,
  loc: new URL(`/${locale}${path}`, SITE).toString(),
  changefreq,
  priority
});

export function GET() {
  const urls = [
    ...staticPages,
    ...categories.map((category) => ({
      path: `/${category.slug}/`,
      changefreq: "weekly",
      priority: "0.8"
    })),
    ...products.filter((product) => product.in_stock !== false).map((product) => ({
      path: `/product/${product.slug}/`,
      changefreq: "weekly",
      priority: "0.7"
    })),
    ...posts.map((post) => ({
      path: `/blog/${post.slug}/`,
      changefreq: "monthly",
      priority: "0.5"
    }))
  ].flatMap((page) => LOCALES.map((locale) => createUrl(page, locale)));

  const uniqueUrls = [...new Map(urls.map((url) => [url.loc, url])).values()];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${uniqueUrls
      .map(
        (url) =>
          `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n${LOCALES.map((locale) => `    <xhtml:link rel="alternate" hreflang="${locale}" href="${escapeXml(new URL(`/${locale}${url.path}`, SITE).toString())}" />`).join("\n")}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(new URL(`/ru${url.path}`, SITE).toString())}" />\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
      )
      .join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } }
  );
}
