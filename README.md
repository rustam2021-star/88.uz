# 88.uz

Static SEO catalog for measuring instruments, auto tools, and technical goods in Tashkent.

## Stack

- Astro
- JSON data files
- Static HTML output
- Nginx-friendly production build

## Commands

```bash
npm install
npm run dev
npm run build
npm run preview
```

## URL Rules

- Home: `/`
- Categories: `/teplovizory/`, `/multimetry/`, `/tolshchinomery/`
- Products: `/product/teplovizor-uni-t-uti260b/`

Product URLs intentionally do not include category or subcategory. One product should have one canonical URL.

## Editing Catalog Data

- Categories: `src/data/categories.json`
- Products: `src/data/products.json`

Product images should be placed in `public/images/products/` and referenced as `/images/products/file-name.webp`.

## Production

After `npm run build`, deploy the generated `dist/` directory to the Nginx site root, for example:

```bash
rsync -av --delete dist/ /var/www/88.uz/public/
```
