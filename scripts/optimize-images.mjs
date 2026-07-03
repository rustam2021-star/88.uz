import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");

const productWidths = [88, 160, 220, 330, 440, 705];
const categoryWidths = [160, 220, 320];
const heroWidths = [768, 1200, 1770];
const bannerWidths = [360, 450, 540];

const products = JSON.parse(await readFile(path.join(rootDir, "src/data/products.json"), "utf8"));
const categories = JSON.parse(await readFile(path.join(rootDir, "src/data/categories.json"), "utf8"));

const tasks = [];

function addImage(src, widths, quality = 72) {
  if (!src || /^https?:\/\//i.test(src)) {
    return;
  }

  tasks.push({ src, widths, quality });
}

function toPublicPath(src) {
  return path.join(publicDir, src.replace(/^\//, "").replaceAll("/", path.sep));
}

function toVariantPath(src, width) {
  const sourcePath = toPublicPath(src);
  const parsed = path.parse(sourcePath);

  return path.join(parsed.dir, "optimized", `${parsed.name}-${width}.webp`);
}

async function fileSize(filePath) {
  try {
    return (await stat(filePath)).size;
  } catch {
    return 0;
  }
}

for (const product of products) {
  addImage(product.main_image, productWidths, 70);
  addImage(product.hover_image, productWidths, 70);

  for (const image of product.gallery || []) {
    addImage(image, productWidths, 70);
  }
}

addImage("/assets/theme/assets/images/product/electronics/product-1.jpg", productWidths, 70);
addImage("/assets/theme/assets/images/blog/blog-1.jpg", productWidths, 70);

for (const category of categories) {
  addImage(category.image, categoryWidths, 72);
}

for (const src of [
  "/assets/theme/assets/images/slider/slider-34.jpg",
  "/assets/theme/assets/images/slider/slider-35.jpg",
  "/assets/theme/assets/images/slider/slider-36.jpg"
]) {
  addImage(src, heroWidths, 74);
}

addImage("/assets/theme/assets/images/section/banner-54.jpg", bannerWidths, 74);

const uniqueTasks = new Map();

for (const task of tasks) {
  const key = `${task.src}|${task.widths.join(",")}|${task.quality}`;
  uniqueTasks.set(key, task);
}

let generated = 0;
let totalOriginalBytes = 0;
let totalVariantBytes = 0;

for (const { src, widths, quality } of uniqueTasks.values()) {
  const sourcePath = toPublicPath(src);
  const originalSize = await fileSize(sourcePath);

  if (!originalSize) {
    console.warn(`Skipped missing image: ${src}`);
    continue;
  }

  totalOriginalBytes += originalSize;

  for (const width of widths) {
    const outputPath = toVariantPath(src, width);

    await mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(sourcePath)
      .rotate()
      .resize({
        width,
        withoutEnlargement: true
      })
      .webp({
        quality,
        effort: 5,
        smartSubsample: true
      })
      .toFile(outputPath);

    totalVariantBytes += await fileSize(outputPath);
    generated += 1;
  }
}

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

console.log(`Generated ${generated} optimized images.`);
console.log(`Source bytes counted: ${formatKiB(totalOriginalBytes)}`);
console.log(`Variant bytes created: ${formatKiB(totalVariantBytes)}`);
