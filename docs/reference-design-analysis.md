# Reference Design Analysis

## 1. Short Analysis

The local reference in `reference_downloader/reference_tfamerce_full/` is a polished electronics ecommerce template. It uses a strong utility header, a wide search field, horizontal category navigation, large promo banners, compact product cards, badges, hover actions, and repeated trust/service strips. The overall feeling is light, commercial, fast to scan, and built around product discovery.

The reference is also template-heavy: it includes Bootstrap, Swiper, animation libraries, jQuery plugins, fashion/beauty menu items, ThemeForest/Themesflat branding, sample payment logos, and many demo-only widgets. Those parts are not appropriate for the 88.uz MVP.

## 2. Useful UI/UX Patterns

- Compact top bar for delivery/contact context.
- Header with logo, visible search, catalog access, phone, and Telegram CTA.
- Horizontal category chips on mobile instead of dense desktop navigation.
- Large but practical hero with product imagery and two conversion actions.
- Promo cards for commercial focus areas.
- Product cards with image area, availability badge, category label, short specs, price, and quick actions.
- Sticky mobile action surfaces for Telegram and phone.
- Category pages with SEO intro, chips, filter/sort controls, product grid, FAQ, and bottom SEO copy.
- Product pages with gallery first on mobile, then price, availability, specs, delivery, related products, and SEO text.

## 3. Inspiration To Reuse

- Ecommerce rhythm: top notice, header, categories, hero, promos, product grid, benefits, footer.
- Light technical palette with dark text, blue/teal primary action, and orange/red only for sale emphasis.
- Rounded cards, clean borders, soft shadows, and spacious product image zones.
- CSS scroll-snap for mobile category rails and promo rows.
- Subtle desktop hover effects while keeping mobile interactions simple.

## 4. What Must Not Be Copied

- Template brand names, demo content, ThemeForest/Themesflat references, and exact text.
- Demo product names/images from the template as production content.
- Template class names and HTML structure as a direct copy.
- Heavy vendor JavaScript: Bootstrap, jQuery, Swiper, WOW, countdown plugins.
- Fashion/beauty/storefront features irrelevant to a technical tools catalog.
- Payment/cart/account UI that the MVP does not support.

## 5. Adaptation For 88.uz

88.uz should become a static SEO catalog for practical products in Tashkent. The implementation keeps the useful ecommerce patterns, but uses original Astro components, local product data, local product images, and lightweight vanilla JavaScript only for menu, search, gallery, FAQ, and filter drawer behavior.

Mobile is the primary layout: delivery notice, compact header, visible search, horizontal category chips, hero, promo cards, product grid, benefits, SEO text, footer, and sticky bottom actions. Desktop expands into a broader header and multi-column grids without changing the core content model.
