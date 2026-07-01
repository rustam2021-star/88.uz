import products from "../data/products.json";
import categories from "../data/categories.json";
import posts from "../data/blog.json";

const site = "https://88.uz";

export function GET() {
  const urls = [
    "/",
    "/catalog/",
    "/blog/",
    "/wishlist/",
    ...categories.map((category) => `/${category.slug}/`),
    ...products.map((product) => `/product/${product.slug}/`),
    ...posts.map((post) => `/blog/${post.slug}/`)
  ];

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
      .map((url) => `  <url><loc>${site}${url}</loc></url>`)
      .join("\n")}\n</urlset>`,
    { headers: { "Content-Type": "application/xml" } }
  );
}
