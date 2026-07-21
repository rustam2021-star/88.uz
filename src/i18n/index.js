export const locales = ["ru", "uz", "en"];
export const defaultLocale = "ru";

export const languageNames = {
  ru: "Русский",
  uz: "O‘zbekcha",
  en: "English"
};

const dictionaries = {
  ru: {
    home: "Главная",
    catalog: "Каталог",
    blog: "Блог",
    wishlist: "Избранное",
    language: "Язык"
  },
  uz: {
    home: "Bosh sahifa",
    catalog: "Katalog",
    blog: "Blog",
    wishlist: "Sevimlilar",
    language: "Til"
  },
  en: {
    home: "Home",
    catalog: "Catalog",
    blog: "Blog",
    wishlist: "Wishlist",
    language: "Language"
  }
};

export function getLocale(pathname = "/") {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return locales.includes(firstSegment) ? firstSegment : defaultLocale;
}

export function useTranslations(locale) {
  const dictionary = dictionaries[locale] || dictionaries[defaultLocale];
  return (key) => dictionary[key] || dictionaries[defaultLocale][key] || key;
}

export function stripLocale(pathname = "/") {
  const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  const parts = cleanPath.split("/");
  if (locales.includes(parts[1])) parts.splice(1, 1);
  const result = parts.join("/") || "/";
  return result.startsWith("/") ? result : `/${result}`;
}

export function localePath(pathname = "/", locale = defaultLocale) {
  const path = stripLocale(pathname);
  return `/${locale}${path === "/" ? "/" : path}`;
}

export function getLanguageAlternates(pathname = "/") {
  return locales.map((locale) => ({ locale, href: localePath(pathname, locale) }));
}
