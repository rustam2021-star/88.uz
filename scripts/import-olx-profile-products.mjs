import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productsPath = path.join(rootDir, 'src/data/products.json');
const categoriesPath = path.join(rootDir, 'src/data/categories.json');
const imageDir = path.join(rootDir, 'public/assets/products');

const PROFILE_URL = 'https://www.olx.uz/list/user/KHr/';
const SOURCE = 'OLX';
const NO_BRAND = 'Без бренда';
const DEFAULT_LOCATION = 'Ташкент';

const categoryNames = {
  'measuring-tools': 'Измерительные приборы',
  'thermal-detectors': 'Тепловизоры и детекторы',
  'auto-service': 'Автоинструменты',
  'tools-equipment': 'Инструменты и оборудование',
  'smart-electronics': 'Электроника',
  'health-beauty': 'Красота и здоровье',
  'pet-products': 'Товары для животных',
  'home-gadgets': 'Товары для дома',
  'kids-products': 'Детские товары и игрушки',
  'fashion-style': 'Мода и стиль'
};

const categoryDefaults = {
  'home-gadgets': {
    slug: 'home-gadgets',
    title: 'Товары для дома',
    quantity: '0 товаров',
    image: '/assets/products/robot-dlya-moiki-okon-1.webp',
    seo_title: 'Товары для дома купить в Ташкенте - 88.uz',
    seo_description: 'Практичные товары для дома, уборки, кухни и бытового ухода с заказом через Telegram или телефон.',
    description_top: 'Подборка полезных товаров для дома, кухни, уборки, ухода за техникой и ежедневного бытового комфорта.',
    description_bottom: 'Перед заказом уточните наличие, комплектацию и способ получения товара в Ташкенте.',
    faq: []
  },
  'kids-products': {
    slug: 'kids-products',
    title: 'Детские товары и игрушки',
    quantity: '0 товаров',
    image: '/assets/products/fpv-mashinka-wi-fi-s-kameroi-1.webp',
    seo_title: 'Детские товары и игрушки купить в Ташкенте - 88.uz',
    seo_description: 'Игрушки, детские гаджеты и полезные аксессуары для детей с заказом в Ташкенте.',
    description_top: 'Игрушки, детские гаджеты и аксессуары для повседневного использования, досуга и развития.',
    description_bottom: 'Возрастные ограничения и комплектацию лучше уточнять перед заказом.',
    faq: []
  },
  'fashion-style': {
    slug: 'fashion-style',
    title: 'Мода и стиль',
    quantity: '0 товаров',
    image: '/assets/products/crocs-38-39-razmer-1.webp',
    seo_title: 'Мода и стиль купить в Ташкенте - 88.uz',
    seo_description: 'Обувь и аксессуары из актуального ассортимента продавца с заказом в Ташкенте.',
    description_top: 'Обувь и аксессуары для повседневного использования из актуального ассортимента продавца.',
    description_bottom: 'Размер, состояние и наличие уточняйте перед заказом.',
    faq: []
  }
};

const skipSourceIds = new Map([
  ['ID3EHrU', 'duplicate of Birbir UNI-T UTi260B'],
  ['ID4l3Hj', 'duplicate of Birbir car flashlight'],
  ['ID3idSF', 'real estate listing'],
  ['ID4pxgM', 'duplicate of Birbir RainPoint timer'],
  ['ID3j9Ie', 'duplicate conditioner cleaning cover listing'],
  ['ID4pvlv', 'duplicate of Birbir automotive endoscope'],
  ['ID3fDqZ', 'site sale listing'],
  ['ID3ru1n', 'duplicate cooling cup listing'],
  ['ID4jwRZ', 'real estate listing']
]);

const productOverrides = {
  ID3Kk5K: {
    title: 'Портативный цифровой высотомер SUNROAD FR510',
    category_slug: 'measuring-tools',
    brand: 'SUNROAD',
    model: 'FR510'
  },
  ID3eBAe: {
    title: 'Анемометр для измерения скорости ветра',
    category_slug: 'measuring-tools',
    brand: NO_BRAND,
    model: ''
  },
  ID3IDQ2: {
    title: 'Полая подушка для сидения с вырезом',
    category_slug: 'health-beauty',
    brand: NO_BRAND,
    model: ''
  },
  ID3VVaA: {
    title: '2-линейный лазерный уровень с зелеными лучами',
    category_slug: 'measuring-tools',
    brand: NO_BRAND,
    model: ''
  },
  ID3SyPY: {
    title: 'Массажер для талии и поясницы',
    category_slug: 'health-beauty',
    brand: NO_BRAND,
    model: ''
  },
  ID3DKK8: {
    title: 'Светодиодный дисплей на заднее стекло автомобиля',
    category_slug: 'auto-service',
    brand: NO_BRAND,
    model: ''
  },
  ID3yu8c: {
    title: 'Чехол для очистки внутреннего блока кондиционера',
    category_slug: 'home-gadgets',
    brand: NO_BRAND,
    model: ''
  },
  ID3pg6h: {
    title: 'Чашка для быстрого охлаждения и нагрева',
    category_slug: 'home-gadgets',
    brand: NO_BRAND,
    model: ''
  },
  ID3eGhe: {
    title: 'Микроскоп 200x для смартфонов',
    category_slug: 'smart-electronics',
    brand: NO_BRAND,
    model: '200x'
  },
  ID41mn7: {
    title: 'Токовые клещи UNI-T UT202A',
    category_slug: 'measuring-tools',
    brand: 'UNI-T',
    model: 'UT202A'
  },
  ID3ydL2: {
    title: 'Набор сменных электродов',
    category_slug: 'health-beauty',
    brand: NO_BRAND,
    model: ''
  },
  ID3WbGv: {
    title: 'Анемометр с обогреваемой струной HT-9829',
    category_slug: 'measuring-tools',
    brand: NO_BRAND,
    model: 'HT-9829'
  },
  ID3WSnS: {
    title: 'Сидушка для копчика для автомобиля',
    category_slug: 'health-beauty',
    brand: NO_BRAND,
    model: ''
  },
  ID3eEbX: {
    title: 'Лайткуб PULUZ для предметной съемки',
    category_slug: 'smart-electronics',
    brand: 'PULUZ',
    model: '24 x 23 x 22 см'
  },
  ID3Cj67: {
    title: 'Увлажнитель воздуха ночник',
    category_slug: 'home-gadgets',
    brand: NO_BRAND,
    model: ''
  },
  ID3nMKM: {
    title: 'Умный корректор осанки для детей',
    category_slug: 'health-beauty',
    brand: NO_BRAND,
    model: ''
  },
  ID3eBKU: {
    title: 'Sonoff Wi-Fi беспроводной переключатель для умного дома',
    category_slug: 'smart-electronics',
    brand: 'Sonoff',
    model: ''
  },
  ID3MrgS: {
    title: 'Робот для мойки окон',
    category_slug: 'home-gadgets',
    brand: NO_BRAND,
    model: ''
  },
  ID3rdFL: {
    title: 'RFID дубликатор домофонных ключей 125 кГц',
    category_slug: 'smart-electronics',
    brand: NO_BRAND,
    model: '125 кГц'
  },
  ID4eMJr: {
    title: 'FPV машинка Wi-Fi с камерой',
    category_slug: 'kids-products',
    brand: NO_BRAND,
    model: ''
  },
  ID450Y0: {
    title: 'Игрушка LABUBU POP MART слепая коробка',
    category_slug: 'kids-products',
    brand: 'POP MART',
    model: 'LABUBU'
  },
  ID3eFrO: {
    title: 'Калибровочные гири 10 мг - 100 г',
    category_slug: 'measuring-tools',
    brand: NO_BRAND,
    model: '10 мг - 100 г'
  },
  ID3D8vu: {
    title: 'Массажер для шеи Nofa FU 3-2',
    category_slug: 'health-beauty',
    brand: 'Nofa',
    model: 'FU 3-2'
  },
  ID3SySO: {
    title: 'Кухонный таймер Xiaomi MIIW Rotating Timer',
    category_slug: 'smart-electronics',
    brand: 'MIIW',
    model: 'Rotating Timer'
  },
  ID3TrP9: {
    title: 'Массажер для шеи',
    category_slug: 'health-beauty',
    brand: NO_BRAND,
    model: ''
  },
  ID42vYm: {
    title: 'Crocs 38-39 размер',
    category_slug: 'fashion-style',
    brand: 'Crocs',
    model: '38-39'
  },
  ID3eBTR: {
    title: 'Тестовая бумага для измерения pH 2 шт',
    category_slug: 'measuring-tools',
    brand: NO_BRAND,
    model: 'pH'
  },
  ID3SyLn: {
    title: 'Электрическая машина для очистки семян',
    category_slug: 'home-gadgets',
    brand: NO_BRAND,
    model: ''
  }
};

const categoryDescription = {
  'measuring-tools': 'Подходит для измерений, проверки параметров и повседневных технических задач.',
  'thermal-detectors': 'Используется для диагностики, контроля температуры и поиска скрытых проблем.',
  'auto-service': 'Практичный аксессуар для автомобиля, диагностики или повседневного обслуживания.',
  'tools-equipment': 'Полезное оборудование для дома, мастерской, ремонта или хозяйственных задач.',
  'smart-electronics': 'Гаджет для дома, офиса, мастерской или повседневного использования.',
  'health-beauty': 'Товар для личного ухода, комфорта или ежедневного использования.',
  'pet-products': 'Аксессуар для ухода, контроля или дрессировки питомца.',
  'home-gadgets': 'Практичный товар для дома, уборки, кухни или бытового комфорта.',
  'kids-products': 'Товар для детского досуга, игры или повседневного использования.',
  'fashion-style': 'Повседневный товар из раздела моды и стиля.'
};

const transliteration = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'i',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
  қ: 'q',
  ғ: 'g',
  ҳ: 'h',
  ў: 'u'
};

function getPrerenderedState(html) {
  const marker = 'window.__PRERENDERED_STATE__= ';
  const start = html.indexOf(marker);

  if (start < 0) {
    throw new Error('OLX prerendered state was not found');
  }

  let index = start + marker.length;
  while (/\s/.test(html[index])) {
    index += 1;
  }

  if (html[index] !== '"') {
    throw new Error('OLX prerendered state has an unexpected format');
  }

  let jsString = '"';
  let escaped = false;
  index += 1;

  for (; index < html.length; index += 1) {
    const char = html[index];
    jsString += char;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      break;
    }
  }

  return JSON.parse(JSON.parse(jsString));
}

async function fetchProfileState(page) {
  const url = page === 1 ? PROFILE_URL : `${PROFILE_URL}?page=${page}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'ru-RU,ru;q=0.9',
      'User-Agent': 'Mozilla/5.0 (compatible; 88.uz product importer)'
    }
  });

  if (!response.ok) {
    throw new Error(`OLX profile fetch failed for page ${page}: ${response.status} ${response.statusText}`);
  }

  return getPrerenderedState(await response.text());
}

function sourceIdFromUrl(url) {
  return url?.match(/-(ID[^.]+)\.html/)?.[1] || '';
}

function normalizeTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/\u0451/g, '\u0435')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function slugify(title) {
  const raw = title
    .toLowerCase()
    .split('')
    .map((char) => transliteration[char] ?? char)
    .join('');

  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function ensureUniqueSlug(baseSlug, usedSlugs, sourceId) {
  let slug = baseSlug || `olx-${sourceId.toLowerCase()}`;

  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug);
    return slug;
  }

  slug = `${slug}-${sourceId.toLowerCase()}`;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${baseSlug || 'olx'}-${sourceId.toLowerCase()}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

function getParam(ad, key) {
  return ad.params?.find((param) => param.key === key);
}

function getPrice(ad) {
  const price = getParam(ad, 'price')?.value;
  const value = price?.currency === 'UZS' ? price.value : price?.converted_value;
  return Number.isFinite(Number(value)) ? Math.round(Number(value)) : 0;
}

function getCondition(ad) {
  const value = getParam(ad, 'state')?.value?.label || getParam(ad, 'condition')?.value?.label;
  return value || 'Новое';
}

function getLocation(ad) {
  const parts = [
    ad.location?.city?.name,
    ad.location?.district?.name || ad.location?.region?.name
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : DEFAULT_LOCATION;
}

function imageUrlFromPhoto(photo) {
  return photo.link
    .replace('{width}', '1200')
    .replace('{height}', '1200')
    .replace(':443/', '/');
}

async function downloadImage(url, targetPath) {
  const safeImageDir = path.resolve(imageDir);
  const resolvedTarget = path.resolve(targetPath);

  if (!resolvedTarget.startsWith(`${safeImageDir}${path.sep}`)) {
    throw new Error(`Unsafe image target: ${resolvedTarget}`);
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'image/webp,image/avif,image/*,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; 88.uz product importer)'
    }
  });

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status} ${response.statusText} ${url}`);
  }

  const input = Buffer.from(await response.arrayBuffer());
  const output = await sharp(input)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer();
  const metadata = await sharp(output).metadata();

  if (metadata.format !== 'webp') {
    throw new Error(`Converted image is not WebP: ${url}`);
  }

  await fs.writeFile(resolvedTarget, output);
}

async function downloadGallery(ad, slug) {
  if (!Array.isArray(ad.photos) || ad.photos.length === 0) {
    throw new Error(`No photos found for ${ad.title}`);
  }

  await fs.mkdir(imageDir, { recursive: true });

  const gallery = [];
  for (const [index, photo] of ad.photos.entries()) {
    const fileName = `${slug}-${index + 1}.webp`;
    const targetPath = path.join(imageDir, fileName);
    await downloadImage(imageUrlFromPhoto(photo), targetPath);
    gallery.push(`/assets/products/${fileName}`);
  }

  return gallery;
}

function formatPrice(price) {
  return new Intl.NumberFormat('ru-RU').format(price);
}

function pluralizeProducts(count) {
  const mod100 = count % 100;
  const mod10 = count % 10;

  if (mod100 >= 11 && mod100 <= 14) {
    return `${count} товаров`;
  }

  if (mod10 === 1) {
    return `${count} товар`;
  }

  if (mod10 >= 2 && mod10 <= 4) {
    return `${count} товара`;
  }

  return `${count} товаров`;
}

function buildSpecs(item, condition, location) {
  const specs = {
    Категория: categoryNames[item.category_slug],
    Состояние: condition,
    Город: location
  };

  if (item.brand && item.brand !== NO_BRAND) {
    specs.Бренд = item.brand;
  }

  if (item.model) {
    specs.Модель = item.model;
  }

  specs['Код объявления'] = item.source_id;
  return specs;
}

function buildProduct(ad, item, id, slug, gallery) {
  const price = getPrice(ad);
  const condition = getCondition(ad);
  const location = getLocation(ad);
  const categoryText = categoryDescription[item.category_slug] || 'Товар из актуального ассортимента продавца.';
  const shortDescription = `${item.title}. ${categoryText}`;
  const description = `${shortDescription} Перед заказом уточните наличие, комплектацию и способ получения.`;

  return {
    id,
    slug,
    source_id: item.source_id,
    source: SOURCE,
    source_url: ad.url,
    title: item.title,
    category_slug: item.category_slug,
    brand: item.brand || NO_BRAND,
    model: item.model || item.title,
    price,
    old_price: null,
    currency: 'UZS',
    in_stock: true,
    condition,
    location,
    badges: ['В наличии'],
    main_image: gallery[0],
    hover_image: gallery[1] || gallery[0],
    gallery,
    short_description: shortDescription,
    description,
    seo_title: `${item.title} купить в Ташкенте | 88.uz`,
    seo_description: `${item.title}. Цена: ${price > 0 ? `${formatPrice(price)} сум` : 'по запросу'}. Заказ через Telegram или телефон в Ташкенте.`,
    specs: buildSpecs(item, condition, location),
    related_products: []
  };
}

function assignRelatedProducts(allProducts, newProducts) {
  for (const product of newProducts) {
    product.related_products = allProducts
      .filter((candidate) => candidate.category_slug === product.category_slug && candidate.slug !== product.slug)
      .slice(0, 4)
      .map((candidate) => candidate.slug);
  }
}

async function updateCategoryCounts(products) {
  const categories = JSON.parse(await fs.readFile(categoriesPath, 'utf8'));
  const knownSlugs = new Set(categories.map((category) => category.slug));

  for (const [slug, category] of Object.entries(categoryDefaults)) {
    if (!knownSlugs.has(slug)) {
      categories.push(category);
    }
  }

  const counts = products.reduce((acc, product) => {
    acc[product.category_slug] = (acc[product.category_slug] || 0) + 1;
    return acc;
  }, {});

  for (const category of categories) {
    category.quantity = pluralizeProducts(counts[category.slug] || 0);
  }

  await fs.writeFile(categoriesPath, `${JSON.stringify(categories, null, 2)}\n`, 'utf8');
}

async function fetchAllAds() {
  const firstState = await fetchProfileState(1);
  const totalPages = firstState.userListing.userListing.totalPages;
  const ads = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const state = page === 1 ? firstState : await fetchProfileState(page);
    const pageAds = state.userListing.adsOffers.data;

    for (const ad of pageAds) {
      ads.push(ad);
    }
  }

  return ads;
}

async function main() {
  const products = JSON.parse(await fs.readFile(productsPath, 'utf8'));
  const ads = await fetchAllAds();
  const usedSlugs = new Set(products.map((product) => product.slug));
  const usedSourceIds = new Set(products.map((product) => product.source_id));
  const normalizedTitles = new Set(products.map((product) => normalizeTitle(product.title)));
  const acceptedTitles = new Set();
  const newProducts = [];
  const skipped = [];
  const nextIdStart = Math.max(...products.map((product) => product.id)) + 1;

  for (const ad of ads) {
    const sourceId = sourceIdFromUrl(ad.url);
    const override = productOverrides[sourceId];

    if (!sourceId) {
      skipped.push(`${ad.id}: missing source id`);
      continue;
    }

    if (usedSourceIds.has(sourceId)) {
      skipped.push(`${sourceId}: already imported`);
      continue;
    }

    if (skipSourceIds.has(sourceId)) {
      skipped.push(`${sourceId}: ${skipSourceIds.get(sourceId)}`);
      continue;
    }

    if (!override) {
      skipped.push(`${sourceId}: no import mapping`);
      continue;
    }

    const titleKey = normalizeTitle(override.title);

    if (normalizedTitles.has(titleKey) || acceptedTitles.has(titleKey)) {
      skipped.push(`${sourceId}: duplicate title "${override.title}"`);
      continue;
    }

    const item = { ...override, source_id: sourceId };
    const slug = ensureUniqueSlug(slugify(item.title), usedSlugs, sourceId);
    const gallery = await downloadGallery(ad, slug);
    const product = buildProduct(ad, item, nextIdStart + newProducts.length, slug, gallery);
    newProducts.push(product);
    acceptedTitles.add(titleKey);
  }

  const allProducts = [...products, ...newProducts];

  if (newProducts.length > 0) {
    assignRelatedProducts(allProducts, newProducts);
    await fs.writeFile(productsPath, `${JSON.stringify(allProducts, null, 2)}\n`, 'utf8');
  }

  await updateCategoryCounts(allProducts);

  console.log(`Fetched ${ads.length} OLX ads from profile.`);
  console.log(`Imported ${newProducts.length} new OLX products.`);
  console.log(`Skipped ${skipped.length} ads.`);
  for (const product of newProducts) {
    console.log(`+ ${product.source_id} ${product.title} (${product.gallery.length} images)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
