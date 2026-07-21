const DELIVERY_NOISE = /(?:Бесплатная доставка[\s\S]*?|Заказы? на бесплатную доставку[\s\S]*?|Если не дозвонились[\s\S]*?|Заказать можно[\s\S]*?|Доставка до филиалов BTS[\s\S]*?|Возможно оплата[\s\S]*?)(?=(?:[А-ЯЁA-Z0-9][^\n]{2,}|$))/giu;
const GENERIC_DESCRIPTION = /(товар из профиля продавца|перед заказом уточните наличие|подходит для измерений, проверки параметров|практичный товар для дома|гаджет для дома|товар для личного ухода|товар для детского досуга)/iu;
const LISTING_NOISE = /(бесплатная доставка|заказы? на бесплатную доставку|после 19:00|если не дозвонились|доставка до филиалов|заказать можно|возможно оплата)/iu;

const CATEGORY_COPY = {
  "measuring-tools": "инструмент для точных измерений и контроля параметров в работе, ремонте и техническом обслуживании",
  "thermal-detectors": "прибор для диагностики, поиска скрытых проблем и контроля параметров в инженерных системах",
  "auto-service": "практичное решение для обслуживания автомобиля и проведения диагностических работ",
  "tools-equipment": "функциональное оборудование для мастерской, ремонта и повседневных технических задач",
  "smart-electronics": "компактное электронное устройство для дома, автомобиля или повседневных задач",
  "health-beauty": "устройство для ухода, личного комфорта и регулярного использования дома",
  "pet-products": "товар для ухода за домашними животными и комфортного повседневного использования",
  "home-gadgets": "практичное устройство для дома, кухни и бытовых задач",
  "kids-products": "товар для игры, творчества и повседневного детского досуга",
  "fashion-style": "повседневный товар с практичным назначением и удобным использованием"
};

function cleanText(value) {
  return String(value || "")
    .replace(DELIVERY_NOISE, " ")
    .replace(/#[\p{L}\p{N}_-]+/gu, "")
    .replace(/\bID:\s*[A-Za-z0-9]+\b/giu, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .trim();
}

function getTechnicalParameters(product) {
  const title = String(product.title || "");
  const values = [];
  const patterns = [
    [/\b\d+\s*[xх*]\s*\d+\b/iu, "разрешение/размер"],
    [/\b\d+(?:[.,]\d+)?\s*(?:мм|см|м|л|кг|г|Вт|W|кГц|ГГц|Мп|°C|C|ppm|Нм|N·m)\b/iu, "параметр"],
    [/\b\d+\s*[-–]\s*\d+(?:[.,]\d+)?\s*(?:мм|см|м|°C|C|Нм|N·m)\b/iu, "диапазон"],
    [/\b\d+\s*(?:в\s*1|в1|X|х)\b/iu, "режим/кратность"]
  ];

  for (const [pattern, label] of patterns) {
    const match = title.match(pattern);
    if (match && !values.some((item) => item.value.toLowerCase() === match[0].toLowerCase())) {
      values.push({ label, value: match[0].replace(/\s+/g, " ").trim() });
    }
  }
  return values;
}

function fallbackCopy(product) {
  const title = String(product.title || "Товар").trim();
  const categoryCopy = CATEGORY_COPY[product.category_slug] || "практичное решение для повседневных задач";
  const brand = product.brand && !/без бренда/i.test(product.brand) ? ` Бренд ${product.brand}.` : "";
  const model = product.model && product.model !== title ? ` Модель ${product.model}.` : "";
  const parameters = getTechnicalParameters(product);
  const parameterText = parameters.length ? ` В названии указаны ключевые параметры: ${parameters.map((item) => item.value).join(", ")}.` : "";
  return {
    shortDescription: `${title} — ${categoryCopy}.${brand}${model}${parameterText} Перед заказом уточните наличие и комплектацию.`,
    description: `${title} — ${categoryCopy}.${brand}${model}${parameterText}\n\nТовар подходит для задач, указанных в названии объявления. Перед покупкой рекомендуем уточнить актуальное наличие, комплектацию и способ получения у продавца.`
  };
}

export function getProfessionalProductContent(product, locale = "ru") {
  const sourceDescription = cleanText(product.description);
  const sourceShortDescription = cleanText(product.short_description);
  const fallback = fallbackCopy(product);
  const isLocalized = locale === "uz" || locale === "en";
  const hasUsefulDescription = isLocalized
    ? sourceDescription.length > 0
    : sourceDescription.length > 180 && !GENERIC_DESCRIPTION.test(sourceDescription) && !LISTING_NOISE.test(sourceDescription);
  const description = hasUsefulDescription ? sourceDescription : fallback.description;
  const shortDescription = (isLocalized ? sourceShortDescription.length > 0 : sourceShortDescription.length > 80 && !GENERIC_DESCRIPTION.test(sourceShortDescription) && !LISTING_NOISE.test(sourceShortDescription))
    ? sourceShortDescription
    : fallback.shortDescription;
  const specs = { ...(product.specs || {}) };
  const labels = locale === "uz"
    ? { condition: "Holati", new: "Yangi", brand: "Brend", model: "Model", parameter: "Asosiy parametr" }
    : locale === "en"
      ? { condition: "Condition", new: "New", brand: "Brand", model: "Model", parameter: "Key parameter" }
      : { condition: "Состояние", new: "Новое", brand: "Бренд", model: "Модель", parameter: "Ключевой параметр" };
  specs[labels.condition] = labels.new;
  if (product.brand && !/без бренда/i.test(product.brand)) specs[labels.brand] = product.brand;
  if (product.model) specs[labels.model] = isLocalized ? product.title : product.model;
  for (const parameter of getTechnicalParameters(product)) {
    if (!Object.values(specs).some((value) => String(value).toLowerCase() === parameter.value.toLowerCase())) {
      specs[`${labels.parameter}`] = parameter.value;
    }
  }
  return { description, shortDescription, specs };
}
