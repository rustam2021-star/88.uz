import { defineConfig } from "astro/config";

export default defineConfig({
  devToolbar: {
    enabled: false
  },
  output: "static",
  site: "https://88.uz",
  i18n: {
    defaultLocale: "ru",
    locales: ["ru", "uz", "en"],
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: true
    }
  }
});
