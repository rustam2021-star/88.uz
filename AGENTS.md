# Project Instructions

## OLX product images

- When importing or refreshing products from the OLX profile, never leave product images pointing directly to `olxcdn.com` / `apollo.olxcdn.com` CDN URLs.
- Download every new OLX product image into `public/assets/products/` as WebP. Prefer deterministic names based on the product slug, for example `product-slug-1.webp`, `product-slug-2.webp`.
- In `src/data/products.json`, use only local image paths for product images:
  - `main_image`: `/assets/products/product-slug-1.webp`
  - `hover_image`: `/assets/products/product-slug-2.webp`
  - `gallery`: local `/assets/products/*.webp` paths only.
- Keep the OLX page URL only in `source_url`; image fields must not use OLX CDN URLs.
- If downloading from OLX CDN, request WebP with an `Accept: image/webp` compatible header and verify that the saved file is actually WebP.
- After updating products, run:
  - `rg -n "olxcdn" src public dist`
  - `npm.cmd run build`
- The final build must not contain `olxcdn` image references. Local images are served by this project so Nginx can cache them with long-lived immutable cache headers.
