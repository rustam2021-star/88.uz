import products from "../data/products.json";
import categories from "../data/categories.json";

const site = "https://example.com";

export function GET() {
  const urls = [
    "/",
    ...categories.map((category) => `/${category.slug}/`),
    ...products.map((product) => `/product/${product.slug}/`)
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((url) => `  <url><loc>${site}${url}</loc></url>`)
      .join("\n")}\n</urlset>`,
    { headers: { "Content-Type": "application/xml" } }
  );
}
