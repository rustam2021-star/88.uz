import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const productsPath = path.join(rootDir, 'src/data/products.json');
const categoriesPath = path.join(rootDir, 'src/data/categories.json');
const imageDir = path.join(rootDir, 'public/assets/products');

const SOURCE = 'Birbir';
const LOCATION = 'Ташкент';
const NO_BRAND = 'Без бренда';

const categoryNames = {
  'measuring-tools': 'Измерительные приборы',
  'thermal-detectors': 'Тепловизоры и детекторы',
  'auto-service': 'Автоинструменты',
  'tools-equipment': 'Инструменты и оборудование',
  'smart-electronics': 'Электроника',
  'health-beauty': 'Красота и здоровье',
  'pet-products': 'Товары для животных'
};

const importItems = [
  {
    source_id: '259654204',
    source_url: 'https://birbir.uz/ru/tashkent/cat/stroyka-i-remont/instrumenty/elektroinstrument/o/tsifrovoy-izmeritel-krutyashchego-momenta-enc-200-259654204',
    title: 'Цифровой измеритель крутящего момента ENC-200',
    category_slug: 'measuring-tools',
    brand: 'ENC',
    model: 'ENC-200',
    price: 450000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/28/fc/c60347de4f2f47de43b61713de1e.png',
    description: 'Цифровой измеритель крутящего момента ENC-200 для контроля затяжки крепежа при ремонте, обслуживании техники и сборочных работах.'
  },
  {
    source_id: '259627180',
    source_url: 'https://birbir.uz/ru/tashkent/cat/bytovaya-tekhnika/klimaticheskoye-oborudovaniye/drugoe/o/tsifrovoy-taymer-poliva-rainpoint-4-zonnyy-259627180',
    title: 'Цифровой таймер полива RainPoint 4-зонный',
    category_slug: 'smart-electronics',
    brand: 'RainPoint',
    model: '4C',
    price: 900000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/25/64/3ea4932be4b9f5721fa41e2f5774.png',
    description: 'Четырехзонный электронный таймер RainPoint для автоматизации полива сада, теплицы или домашних растений по заданному расписанию.'
  },
  {
    source_id: '259498860',
    source_url: 'https://birbir.uz/ru/tashkent/cat/transport/zapchasti-i-aksessuary/aksessuary/o/endoskop-dlya-avtomobilya-2metra-s-ekranom-259498860',
    title: 'Автомобильный эндоскоп 2 м с экраном',
    category_slug: 'auto-service',
    brand: NO_BRAND,
    model: '2 м',
    price: 1250000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/52/92/15131ea0c631c4413e98cabd9bcf.jpg',
    description: 'Автомобильный эндоскоп с двухметровым кабелем и экраном для осмотра труднодоступных мест при диагностике и ремонте.'
  },
  {
    source_id: '252897909',
    source_url: 'https://birbir.uz/ru/tashkent/cat/transport/zapchasti-i-aksessuary/aksessuary/o/avtomobil-uchun-kalyan-252897909',
    title: 'Кальян для автомобиля',
    category_slug: 'auto-service',
    brand: NO_BRAND,
    model: '',
    price: 300000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/19/05/23d705252025a9d9372fab723eba.png',
    description: 'Компактный автомобильный кальян для использования в дороге или на отдыхе. Комплектацию и совместимость уточняйте перед заказом.'
  },
  {
    source_id: '243222997',
    source_url: 'https://birbir.uz/ru/tashkent/cat/krasota-i-zdorovye/pribory-i-aksessuary/pribory-dlya-ukhoda-za-kozhey/o/umnaya-ushnaya-palochka-xiaomi-bebird-3-sinyaya-r37r-243222997',
    title: 'Умная ушная палочка Xiaomi Bebird 3 R37R',
    category_slug: 'health-beauty',
    brand: 'Bebird',
    model: 'R37R',
    price: 450000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/f3/12/c11ffda222c0228658a9cef0fbbc.jpg',
    description: 'Умная ушная палочка Xiaomi Bebird 3 с камерой для аккуратной гигиены ушей и визуального контроля через мобильное приложение.'
  },
  {
    source_id: '243208909',
    source_url: 'https://birbir.uz/ru/tashkent/cat/bytovaya-tekhnika/dlya-doma/procheye/o/magnitnyy-tsifrovoy-taymer-timer-led-243208909',
    title: 'Магнитный цифровой таймер TIMER LED',
    category_slug: 'smart-electronics',
    brand: NO_BRAND,
    model: 'TIMER LED',
    price: 100000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/f1/4a/2f3a17e27c6fc01e7954f0e66cf6.png',
    description: 'Цифровой LED-таймер с магнитным креплением для кухни, тренировок, учебы, процедур и других задач с точным отсчетом времени.'
  },
  {
    source_id: '243202844',
    source_url: 'https://birbir.uz/ru/tashkent/cat/krasota-i-zdorovye/procheye/o/apparat-udaleniye-rodinok-udaleniye-borodavok-243202844',
    title: 'Аппарат для удаления родинок и бородавок Aceshop',
    category_slug: 'health-beauty',
    brand: 'Aceshop',
    model: 'Plasma Pen',
    price: 170000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/61/ae/893188689b79820c43fda4087bab.png',
    description: 'Плазменная ручка Aceshop для косметических процедур. Перед применением внимательно изучите инструкцию и меры безопасности.'
  },
  {
    source_id: '239733930',
    source_url: 'https://birbir.uz/ru/tashkent/cat/transport/zapchasti-i-aksessuary/instrumenty/o/tester-tormoznoy-zhidkosti-autool-as502-239733930',
    title: 'Тестер тормозной жидкости AUTOOL AS502',
    category_slug: 'auto-service',
    brand: 'AUTOOL',
    model: 'AS502',
    price: 360000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/fe/2e/6e3ceb98c861900788152d7d0d00.png',
    description: 'AUTOOL AS502 помогает проверить содержание воды в тормозной жидкости и оценить необходимость обслуживания тормозной системы.'
  },
  {
    source_id: '239257142',
    source_url: 'https://birbir.uz/ru/tashkent/cat/stroyka-i-remont/instrumenty/prochiy-instrument/o/lyuksmetr-ta636a-izmeritel-osveshchennosti-239257142',
    title: 'Люксметр TASI TA636A',
    category_slug: 'measuring-tools',
    brand: 'TASI',
    model: 'TA636A',
    price: 200000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/9f/12/a08c9b27a5aeb88e94e2184b6185.png',
    description: 'Люксметр TASI TA636A для измерения освещенности в помещениях, на рабочих местах, объектах ремонта и производственных участках.'
  },
  {
    source_id: '238947050',
    source_url: 'https://birbir.uz/ru/tashkent/cat/zhivotnyye/tovary-dlya-zhivotnykh/o/osheynik-biper-dlya-sobak-238947050',
    title: 'Ошейник-бипер для собак',
    category_slug: 'pet-products',
    brand: NO_BRAND,
    model: '',
    price: 460000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/4a/5f/98897801aca35c2c9e10025849ed.png',
    description: 'Ошейник-бипер для собак помогает быстрее находить питомца и контролировать его местоположение во время прогулки или дрессировки.'
  },
  {
    source_id: '238942990',
    source_url: 'https://birbir.uz/ru/tashkent/cat/stroyka-i-remont/instrumenty/elektroinstrument/o/aneng-621a-multimetr-238942990',
    title: 'Мультиметр Aneng 621A',
    category_slug: 'measuring-tools',
    brand: 'ANENG',
    model: '621A',
    price: 320000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/0c/d3/ddf807dcd8254916906b628959d6.png',
    description: 'Цифровой мультиметр Aneng 621A для базовых электрических измерений, проверки цепей и повседневных задач электромонтажа.'
  },
  {
    source_id: '229876326',
    source_url: 'https://birbir.uz/ru/tashkent/cat/stroyka-i-remont/instrumenty/elektroinstrument/o/teplovizor-infrakrasnyy-promyshlennyy-uni-t-uti260b-229876326',
    title: 'Промышленный тепловизор UNI-T UTi260B',
    category_slug: 'thermal-detectors',
    brand: 'UNI-T',
    model: 'UTi260B',
    price: 3200000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/de/f4/b4953eebd24a643627d6292b8244.png',
    description: 'Инфракрасный тепловизор UNI-T UTi260B для диагностики оборудования, электрики, теплопотерь и перегрева узлов.'
  },
  {
    source_id: '229877940',
    source_url: 'https://birbir.uz/ru/tashkent/cat/stroyka-i-remont/instrumenty/prochiy-instrument/o/smart-sensor-ph828-pn-metr-dlya-vody-229877940',
    title: 'SMART SENSOR PH828 pH-метр для воды',
    category_slug: 'measuring-tools',
    brand: 'Smart Sensor',
    model: 'PH828',
    price: 500000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/74/73/a6512d07041f72c823171c165451.png',
    description: 'SMART SENSOR PH828 предназначен для контроля pH воды в бытовых, лабораторных, аквариумных и хозяйственных задачах.'
  },
  {
    source_id: '228215513',
    source_url: 'https://birbir.uz/ru/tashkent/cat/bytovaya-tekhnika/klimaticheskoye-oborudovaniye/termometry-i-meteostantsii/o/temperatura-vlazhnosti-uglekislogo-gaza-228215513',
    title: 'Qingping Air Monitor 3-в-1 CO2, температура и влажность',
    category_slug: 'smart-electronics',
    brand: 'Qingping',
    model: 'Air Monitor 3-in-1',
    price: 750000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/4f/44/063036d3d98a18f04d40351103f1.png',
    description: 'Монитор качества воздуха Qingping 3-в-1 показывает уровень CO2, температуру и влажность для дома, офиса или учебного класса.'
  },
  {
    source_id: '227757608',
    source_url: 'https://birbir.uz/ru/tashkent/cat/stroyka-i-remont/instrumenty/prochiy-instrument/o/tolshchinomer-avtomobilnyy-tolshchiny-kraski-227757608',
    title: 'Толщиномер автомобильной краски DELIXI',
    category_slug: 'auto-service',
    brand: 'DELIXI',
    model: '',
    price: 500000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/20/ce/24695be9364405e4c32eb9e95e35.png',
    description: 'Толщиномер DELIXI для проверки лакокрасочного покрытия автомобиля при осмотре кузова, подборе авто и диагностике ремонта.'
  },
  {
    source_id: '225409803',
    source_url: 'https://birbir.uz/ru/tashkent/cat/mebel-i-interer/posuda-i-tovary-dlya-kukhni/khozyaystvennyye-tovary/o/otpugivatel-ptits-vetryanoy-svetootrazhayushchiy-225409803',
    title: 'Ветряной светоотражающий отпугиватель птиц',
    category_slug: 'tools-equipment',
    brand: NO_BRAND,
    model: '',
    price: 130000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/95/eb/d21f8ea1f1b5ba068c422a81683b.png',
    description: 'Светоотражающий ветряной отпугиватель птиц для сада, балкона, дачи, огорода и открытых хозяйственных участков.'
  },
  {
    source_id: '225147885',
    source_url: 'https://birbir.uz/ru/tashkent/cat/fototehnika/binokli-i-teleskopy/o/dalnomer-nohawk-nk-450-225147885',
    title: 'Дальномер NOHAWK NK-450',
    category_slug: 'measuring-tools',
    brand: 'NOHAWK',
    model: 'NK-450',
    price: 600000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/46/e7/f33a2040f1d9cc31374aa63d9dd4.jpg',
    description: 'NOHAWK NK-450 подходит для измерения расстояний на охоте, рыбалке, прогулках, строительных и хозяйственных задачах.'
  },
  {
    source_id: '224241886',
    source_url: 'https://birbir.uz/ru/tashkent/cat/stroyka-i-remont/instrumenty/prochiy-instrument/o/ms5902r-avtomaticheskiy-tester-predokhraniteley-224241886',
    title: 'Автоматический тестер предохранителей MASTECH MS5902R',
    category_slug: 'tools-equipment',
    brand: 'MASTECH',
    model: 'MS5902R',
    price: 450000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/06/8c/eb134c2c85ebcc69cbd197c80448.png',
    description: 'MASTECH MS5902R предназначен для автоматической проверки предохранителей и быстрого поиска неисправностей в электрических цепях.'
  },
  {
    source_id: '223388713',
    source_url: 'https://birbir.uz/ru/tashkent/cat/transport/zapchasti-i-aksessuary/zapchasti/o/moshchnyy-fonar-na-avto-223388713',
    title: 'Мощный автомобильный фонарь 180W',
    category_slug: 'auto-service',
    brand: NO_BRAND,
    model: '180W',
    price: 1750000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/05/7d/a8d9fc879ca942042b8f1363b009.jpg',
    description: 'Мощный автомобильный фонарь 180W с дистанционным управлением для дополнительного освещения автомобиля или спецтехники.'
  },
  {
    source_id: '221898224',
    source_url: 'https://birbir.uz/ru/tashkent/cat/bytovaya-tekhnika/klimaticheskoye-oborudovaniye/drugoe/o/tester-uglekislogo-gaza-co2-atuman-221898224',
    title: 'Тестер углекислого газа Atuman CF1',
    category_slug: 'smart-electronics',
    brand: 'Atuman',
    model: 'CF1',
    price: 500000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/f0/e1/32cace6233246b673d60262eb027.jpg',
    description: 'Atuman CF1 измеряет уровень CO2 и помогает контролировать качество воздуха дома, в офисе, кабинете или учебном помещении.'
  },
  {
    source_id: '218597132',
    source_url: 'https://birbir.uz/ru/tashkent/cat/mebel-i-interer/posuda-i-tovary-dlya-kukhni/kukhonnyye-aksessuary/o/elektricheskiy-otkryvatel-kryshek-218597132',
    title: 'Электрический открыватель крышек',
    category_slug: 'tools-equipment',
    brand: NO_BRAND,
    model: '',
    price: 210000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/a3/48/2e38530f1d82d754d57b236c8167.png',
    description: 'Электрический открыватель помогает быстро открывать тугие крышки банок и бутылок без лишнего усилия.'
  },
  {
    source_id: '185513034',
    source_url: 'https://birbir.uz/ru/tashkent/cat/bytovaya-tekhnika/klimaticheskoye-oborudovaniye/termometry-i-meteostantsii/o/termoregulyator-termostat-belyy-185513034',
    title: 'Беспроводной Wi-Fi термостат RKHK для газового котла',
    category_slug: 'smart-electronics',
    brand: 'Tuya',
    model: 'RKHK',
    price: 550000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/f7/2b/a75b9877ef5a4dfbb43f226a5c78.png',
    description: 'Беспроводной Wi-Fi термостат RKHK для управления газовым котлом через Tuya и поддержания комфортной температуры.'
  },
  {
    source_id: '132837360',
    source_url: 'https://birbir.uz/ru/tashkent/cat/hobbi-i-sport/drugoye/o/opryskivatel-akkumulyatornyy-sadovyy-raspylitel-132837360',
    title: 'Аккумуляторный садовый опрыскиватель',
    category_slug: 'tools-equipment',
    brand: NO_BRAND,
    model: '',
    price: 160000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/6f/5e/3e38c2553dd9f9419dab48d6a9bc.jpg',
    description: 'Аккумуляторный садовый распылитель для ухода за растениями, обработки участка и равномерного нанесения жидких составов.'
  },
  {
    source_id: '127235170',
    source_url: 'https://birbir.uz/ru/tashkent/cat/hobbi-i-sport/sport-otdykh/okhota-rybalka/o/nalobnyy-fonar-led-zaryazhayemyy-super-yarkiy-legkiy-127235170',
    title: 'Налобный LED-фонарь заряжаемый',
    category_slug: 'tools-equipment',
    brand: NO_BRAND,
    model: 'LED',
    price: 120000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/59/6a/895743cd72f7b0ab29e53baffa72.jpg',
    description: 'Легкий заряжаемый налобный LED-фонарь для работы, рыбалки, походов, ремонта и задач, где нужны свободные руки.'
  },
  {
    source_id: '119142219',
    source_url: 'https://birbir.uz/ru/tashkent/cat/bytovaya-tekhnika/dlya-kukhni/melkaya-kukhonnaya-tekhnika/o/otdelitel-kostochek-ot-vishen-leifheit-119142219',
    title: 'Отделитель косточек от вишни Leifheit',
    category_slug: 'tools-equipment',
    brand: 'Leifheit',
    model: '',
    price: 540000,
    condition: 'Новое',
    image_url: 'https://cdn-img.birbir.uz/i/800x800-fit/files/94/be/c9dc52f9e3eff79ede4b50900961.jpg',
    description: 'Отделитель косточек Leifheit ускоряет подготовку вишни и черешни для выпечки, варенья, заморозки и домашних заготовок.'
  }
];

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

function normalizeTitle(title) {
  return title
    .toLowerCase()
    .replace(/ё/g, 'е')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zа-я0-9]+/gi, ' ')
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
  let slug = baseSlug || `birbir-${sourceId}`;
  if (!usedSlugs.has(slug)) {
    usedSlugs.add(slug);
    return slug;
  }

  slug = `${slug}-${sourceId}`;
  let suffix = 2;
  while (usedSlugs.has(slug)) {
    slug = `${baseSlug || 'birbir'}-${sourceId}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
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

function buildSpecs(item) {
  const specs = {
    Категория: categoryNames[item.category_slug],
    Состояние: item.condition,
    Город: LOCATION
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

function buildProduct(item, id, slug, imagePath) {
  const priceText = formatPrice(item.price);
  const description = `${item.description} Перед заказом уточните наличие, комплектацию и способ получения.`;

  return {
    id,
    slug,
    source_id: item.source_id,
    source: SOURCE,
    source_url: item.source_url,
    title: item.title,
    category_slug: item.category_slug,
    brand: item.brand || NO_BRAND,
    model: item.model || item.title,
    price: item.price,
    old_price: null,
    currency: 'UZS',
    in_stock: true,
    condition: item.condition,
    location: LOCATION,
    badges: ['В наличии'],
    main_image: imagePath,
    hover_image: imagePath,
    gallery: [imagePath],
    short_description: item.description,
    description,
    seo_title: `${item.title} купить в Ташкенте | 88.uz`,
    seo_description: `${item.title}. Цена: ${priceText} сум. Заказ через Telegram или телефон в Ташкенте.`,
    specs: buildSpecs(item),
    related_products: []
  };
}

async function downloadProductImage(item, slug) {
  const safeImageDir = path.resolve(imageDir);
  const targetPath = path.resolve(safeImageDir, `${slug}-1.webp`);

  if (!targetPath.startsWith(`${safeImageDir}${path.sep}`)) {
    throw new Error(`Unsafe image target: ${targetPath}`);
  }

  const response = await fetch(item.image_url, {
    headers: {
      Accept: 'image/webp,image/avif,image/*,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; 88.uz product importer)'
    }
  });

  if (!response.ok) {
    throw new Error(`Image download failed for ${item.source_id}: ${response.status} ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.mkdir(safeImageDir, { recursive: true });
  const webpBuffer = await sharp(buffer)
    .rotate()
    .resize({ width: 900, height: 900, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer();

  const metadata = await sharp(webpBuffer).metadata();
  if (metadata.format !== 'webp') {
    throw new Error(`Converted file is not WebP for ${item.source_id}`);
  }

  await fs.writeFile(targetPath, webpBuffer);
  return `/assets/products/${slug}-1.webp`;
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
  const counts = products.reduce((acc, product) => {
    acc[product.category_slug] = (acc[product.category_slug] || 0) + 1;
    return acc;
  }, {});

  for (const category of categories) {
    category.quantity = pluralizeProducts(counts[category.slug] || 0);
  }

  await fs.writeFile(categoriesPath, `${JSON.stringify(categories, null, 2)}\n`, 'utf8');
}

async function main() {
  const products = JSON.parse(await fs.readFile(productsPath, 'utf8'));
  const usedSlugs = new Set(products.map((product) => product.slug));
  const usedSourceKeys = new Set(
    products.flatMap((product) => [`${product.source}:${product.source_id}`, product.source_url].filter(Boolean))
  );
  const normalizedTitles = new Set(products.map((product) => normalizeTitle(product.title)));
  const acceptedTitleKeys = new Set();
  const nextIdStart = Math.max(...products.map((product) => product.id)) + 1;
  const pendingItems = [];
  const skippedItems = [];

  for (const item of importItems) {
    const sourceKey = `${SOURCE}:${item.source_id}`;
    const titleKey = normalizeTitle(item.title);

    if (usedSourceKeys.has(sourceKey) || usedSourceKeys.has(item.source_url)) {
      skippedItems.push(`${item.source_id}: already imported`);
      continue;
    }

    if (normalizedTitles.has(titleKey) || acceptedTitleKeys.has(titleKey)) {
      skippedItems.push(`${item.source_id}: duplicate title "${item.title}"`);
      continue;
    }

    acceptedTitleKeys.add(titleKey);
    pendingItems.push(item);
  }

  const newProducts = [];

  for (const [index, item] of pendingItems.entries()) {
    const slug = ensureUniqueSlug(slugify(item.title), usedSlugs, item.source_id);
    const imagePath = await downloadProductImage(item, slug);
    newProducts.push(buildProduct(item, nextIdStart + index, slug, imagePath));
  }

  if (newProducts.length > 0) {
    const allProducts = [...products, ...newProducts];
    assignRelatedProducts(allProducts, newProducts);
    await fs.writeFile(productsPath, `${JSON.stringify(allProducts, null, 2)}\n`, 'utf8');
    await updateCategoryCounts(allProducts);
  } else {
    await updateCategoryCounts(products);
  }

  console.log(`Imported ${newProducts.length} Birbir products.`);
  if (skippedItems.length > 0) {
    console.log(`Skipped ${skippedItems.length}:`);
    for (const item of skippedItems) {
      console.log(`- ${item}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
