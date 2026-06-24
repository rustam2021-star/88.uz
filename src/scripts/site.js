const normalize = (value) => String(value || "").toLowerCase().replaceAll("ё", "е").trim();

function closeMobileMenu() {
  const toggle = document.querySelector("[data-mobile-menu-toggle]");
  const menu = document.querySelector("#mobile-menu");
  document.body.classList.remove("mobile-menu-open");
  toggle?.setAttribute("aria-expanded", "false");
  menu?.setAttribute("aria-hidden", "true");
}

function initMobileMenu() {
  const toggle = document.querySelector("[data-mobile-menu-toggle]");
  const menu = document.querySelector("#mobile-menu");
  const overlay = document.querySelector("[data-mobile-menu-close].mobile-menu-overlay");

  toggle?.addEventListener("click", () => {
    const open = document.body.classList.toggle("mobile-menu-open");
    toggle.setAttribute("aria-expanded", String(open));
    menu?.setAttribute("aria-hidden", String(!open));
  });

  overlay?.addEventListener("click", closeMobileMenu);
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-mobile-menu-link]")) closeMobileMenu();
  });
}

function resultMarkup(item) {
  return `
    <a class="catalog-result" href="${item.href}" data-mobile-menu-link>
      <span>${item.type}</span>
      <strong>${item.title}</strong>
      <small>${item.meta}</small>
    </a>
  `;
}

function initCatalogSearch() {
  const dataNode = document.querySelector("#catalog-search-data");
  const searchItems = dataNode ? JSON.parse(dataNode.textContent || "[]") : [];

  function renderResults(root, query = "") {
    const results = root.querySelector("[data-catalog-search-results]");
    if (!results) return;

    const normalizedQuery = normalize(query);
    if (!normalizedQuery) {
      results.hidden = true;
      results.innerHTML = "";
      return;
    }

    const matches = searchItems
      .filter((item) => normalize(item.search).includes(normalizedQuery))
      .slice(0, 7);

    results.hidden = false;
    results.innerHTML = matches.length
      ? matches.map(resultMarkup).join("")
      : `<p class="mobile-empty">Ничего не найдено. Напишите в Telegram, подберем вручную.</p>`;
  }

  function submitSearch(root) {
    const input = root.querySelector("[data-catalog-search]");
    const query = input?.value || "";
    const firstMatch = searchItems.find((item) => normalize(item.search).includes(normalize(query)));
    if (firstMatch) {
      window.location.href = firstMatch.href;
      return;
    }
    renderResults(root, query);
    input?.focus();
  }

  document.querySelectorAll("[data-search-root]").forEach((root) => {
    const input = root.querySelector("[data-catalog-search]");
    const results = root.querySelector("[data-catalog-search-results]");
    const submit = root.querySelector("[data-search-submit]");

    input?.addEventListener("input", (event) => renderResults(root, event.currentTarget.value));
    input?.addEventListener("focus", (event) => renderResults(root, event.currentTarget.value));
    input?.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        submitSearch(root);
      }
    });
    submit?.addEventListener("click", () => submitSearch(root));
    root.addEventListener("focusout", () => {
      window.setTimeout(() => {
        if (!root.contains(document.activeElement) && results) results.hidden = true;
      }, 120);
    });
  });
}

function initFilterSheet() {
  const open = document.querySelector("[data-filter-open]");
  const close = document.querySelector("[data-filter-close]");
  open?.addEventListener("click", () => document.body.classList.add("filter-sheet-open"));
  close?.addEventListener("click", () => document.body.classList.remove("filter-sheet-open"));
}

function initProductGallery() {
  document.querySelectorAll("[data-gallery]").forEach((gallery) => {
    const main = gallery.querySelector("[data-gallery-main]");
    gallery.querySelectorAll("[data-gallery-thumb]").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const image = thumb.getAttribute("data-gallery-thumb");
        if (main && image) main.src = image;
      });
    });
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
    document.body.classList.remove("filter-sheet-open");
  }
});

initMobileMenu();
initCatalogSearch();
initFilterSheet();
initProductGallery();
