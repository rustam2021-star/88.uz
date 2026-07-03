import { defineConfig } from "astro/config";

export default defineConfig({
  devToolbar: {
    enabled: false
  },
  output: "static",
  build: {
    inlineStylesheets: "always"
  },
  site: "https://example.com"
});
