import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import products from "../src/data/products.json" with { type: "json" };
import categories from "../src/data/categories.json" with { type: "json" };
import { getCanonicalUrl, seoMap } from "../src/lib/seo.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");
const errors = [];
const warnings = [];

const addDuplicateIssues = (field) => {
  const groups = new Map();

  for (const page of seoMap) {
    const value = page[field];
    if (!value) continue;
    const pages = groups.get(value) || [];
    pages.push(page.url);
    groups.set(value, pages);
  }

  for (const [value, pages] of groups) {
    if (pages.length > 1) {
      errors.push(`Duplicate ${field}: ${JSON.stringify(value)} at ${pages.join(", ")}`);
    }
  }
};

for (const page of seoMap) {
  for (const field of ["url", "pageType", "searchIntent", "primaryKeyword", "title", "description", "h1", "canonical", "robots"]) {
    if (!page[field]) {
      errors.push(`${page.url || "<unknown>"}: empty ${field}`);
    }
  }

  if (page.canonical !== getCanonicalUrl(page.url)) {
    errors.push(`${page.url}: canonical must be self-referencing (${getCanonicalUrl(page.url)})`);
  }

  if (!page.url.startsWith("/") || !page.url.endsWith("/")) {
    errors.push(`${page.url}: URL must start and end with a slash`);
  }

  if (page.title.length < 30 || page.title.length > 110) {
    warnings.push(`${page.url}: title length ${page.title.length} is outside the 30–110 character review range`);
  }

  if (page.description.length < 70 || page.description.length > 170) {
    warnings.push(`${page.url}: description length ${page.description.length} is outside the 70–170 character review range`);
  }
}

for (const field of ["title", "description", "h1", "primaryKeyword"]) {
  addDuplicateIssues(field);
}

const knownUrls = new Set(seoMap.map((page) => page.url));
for (const page of seoMap) {
  for (const link of page.internalLinks || []) {
    if (link.startsWith("http") || knownUrls.has(link)) continue;
    errors.push(`${page.url}: internal link is not in the SEO map: ${link}`);
  }
}

for (const category of categories) {
  const categoryProductCount = products.filter((product) => product.category_slug === category.slug).length;
  if (categoryProductCount === 0) {
    warnings.push(`${category.slug}: category has no products`);
  }
}

for (const product of products) {
  const images = [product.main_image, product.hover_image, ...(product.gallery || [])].filter(Boolean);
  for (const image of images) {
    if (/^https?:\/\//i.test(image)) {
      errors.push(`${product.slug}: product image must be local: ${image}`);
    }

    if (!fs.existsSync(path.join(root, "public", image.replace(/^\//, "").replaceAll("/", path.sep)))) {
      errors.push(`${product.slug}: missing product image: ${image}`);
    }
  }
}

const getDistFile = (url) => {
  const relative = url.replace(/^\/+|\/+$/g, "");
  return relative ? path.join(dist, relative, "index.html") : path.join(dist, "index.html");
};

const readBuiltPage = (page) => {
  const file = getDistFile(page.url);
  if (!fs.existsSync(file)) {
    errors.push(`${page.url}: missing built route (${file})`);
    return "";
  }

  return fs.readFileSync(file, "utf8");
};

for (const page of seoMap) {
  const html = readBuiltPage(page);
  if (!html) continue;

  const titleMatches = html.match(/<title>[^<]*<\/title>/gi) || [];
  const descriptionMatches = html.match(/<meta name="description"[^>]*>/gi) || [];
  const canonicalMatches = html.match(/<link rel="canonical"[^>]*>/gi) || [];
  const h1Matches = html.match(/<h1\b[^>]*>/gi) || [];
  const jsonLdMatches = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)];

  if (titleMatches.length !== 1 || !titleMatches[0].includes(`<title>${page.title}</title>`)) {
    errors.push(`${page.url}: title does not match the SEO map`);
  }
  if (descriptionMatches.length !== 1 || !descriptionMatches[0].includes(`content="${page.description}"`)) {
    errors.push(`${page.url}: description does not match the SEO map`);
  }
  if (canonicalMatches.length !== 1 || !canonicalMatches[0].includes(`href="${page.canonical}"`)) {
    errors.push(`${page.url}: canonical is missing or duplicated`);
  }
  if (h1Matches.length !== 1) {
    errors.push(`${page.url}: expected exactly one visible h1, found ${h1Matches.length}`);
  }
  if (jsonLdMatches.length !== 1) {
    errors.push(`${page.url}: expected exactly one JSON-LD block, found ${jsonLdMatches.length}`);
  } else {
    try {
      const jsonLd = JSON.parse(jsonLdMatches[0][1]);
      const types = new Set((jsonLd["@graph"] || []).map((item) => item["@type"]));
      for (const type of ["Organization", "WebSite", "BreadcrumbList"]) {
        if (!types.has(type)) errors.push(`${page.url}: JSON-LD is missing ${type}`);
      }
    } catch (error) {
      errors.push(`${page.url}: invalid JSON-LD (${error.message})`);
    }
  }
}

if (fs.existsSync(path.join(dist, "sitemap.xml"))) {
  const sitemap = fs.readFileSync(path.join(dist, "sitemap.xml"), "utf8");
  const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
  const expectedSitemapUrls = seoMap.filter((page) => page.pageType !== "article" || page.robots === "index, follow").map((page) => page.canonical);
  const missingFromSitemap = expectedSitemapUrls.filter((url) => !sitemapUrls.includes(url));
  if (missingFromSitemap.length) warnings.push(`Sitemap does not contain ${missingFromSitemap.length} SEO-map URLs`);
  if (sitemapUrls.some((url) => /wishlist|\?/i.test(url))) errors.push("Sitemap contains a technical or parameter URL");
}

const robotsFile = path.join(dist, "robots.txt");
if (fs.existsSync(robotsFile)) {
  const robots = fs.readFileSync(robotsFile, "utf8");
  if (!robots.includes("Sitemap: https://88.uz/sitemap.xml")) errors.push("robots.txt does not reference sitemap.xml");
  if (!robots.includes("Disallow: /wishlist/")) warnings.push("robots.txt does not disallow wishlist");
}

console.log(`SEO map: ${seoMap.length} indexable pages`);
console.log(`Errors: ${errors.length}`);
console.log(`Warnings: ${warnings.length}`);
for (const warning of warnings) console.log(`WARN ${warning}`);
for (const error of errors) console.error(`ERROR ${error}`);

if (errors.length) process.exit(1);
