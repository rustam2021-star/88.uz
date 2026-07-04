import products from "../data/products.json";
import categories from "../data/categories.json";
import posts from "../data/blog.json";

const SITE = "https://88.uz";

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

const createUrl = ({ path, changefreq = "weekly", priority = "0.6" }) => ({
  loc: new URL(path, SITE).toString(),
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
    ...products.map((product) => ({
      path: `/product/${product.slug}/`,
      changefreq: "weekly",
      priority: "0.7"
    })),
    ...posts.map((post) => ({
      path: `/blog/${post.slug}/`,
      changefreq: "monthly",
      priority: "0.5"
    }))
  ].map(createUrl);

  const uniqueUrls = [...new Map(urls.map((url) => [url.loc, url])).values()];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${uniqueUrls
      .map(
        (url) =>
          `  <url>\n    <loc>${escapeXml(url.loc)}</loc>\n    <changefreq>${url.changefreq}</changefreq>\n    <priority>${url.priority}</priority>\n  </url>`
      )
      .join("\n")}\n</urlset>\n`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } }
  );
}
