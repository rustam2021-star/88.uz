(function () {
  "use strict";

  var STORAGE_KEY = "88uz:wishlist:v1";

  function readWishlist() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      var parsed = value ? JSON.parse(value) : [];
      return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch (error) {
      return [];
    }
  }

  function writeWishlist(items) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  function normalizeUrl(value) {
    if (!value) return "#";
    try {
      return new URL(value, window.location.origin).pathname;
    } catch (error) {
      return value;
    }
  }

  function hashText(value) {
    var hash = 0;
    for (var index = 0; index < value.length; index += 1) {
      hash = (hash << 5) - hash + value.charCodeAt(index);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  }

  function getText(root, selector) {
    var element = root.querySelector(selector);
    return element ? element.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function formatProductActionLabel(action, productName) {
    return productName ? action + ": " + productName : action;
  }

  function getImage(card) {
    var image = card.querySelector(".img-product, .product-img img, img");
    if (!image) return "";
    return image.currentSrc || image.getAttribute("src") || image.getAttribute("data-src") || "";
  }

  function getProductFromCard(trigger) {
    var card = trigger.closest(".card-product");
    if (!card && trigger.hasAttribute("data-wishlist-id")) {
      return {
        id: trigger.getAttribute("data-wishlist-id"),
        name: trigger.getAttribute("data-wishlist-name") || "Товар",
        url: normalizeUrl(trigger.getAttribute("data-wishlist-url")),
        image: trigger.getAttribute("data-wishlist-image") || "",
        price: trigger.getAttribute("data-wishlist-price") || "",
        oldPrice: trigger.getAttribute("data-wishlist-old-price") || ""
      };
    }
    if (!card) return null;

    var link = card.querySelector(".product-img[href], .name-product[href], .name[href], .prd_name[href]");
    var rawUrl = link ? link.getAttribute("href") : "#";
    var url = normalizeUrl(rawUrl);
    var name = getText(card, ".name-product, .name, .prd_name");
    var image = getImage(card);
    var price = getText(card, ".price-new") || getText(card, ".price");
    var oldPrice = getText(card, ".price-old");
    var match = url.match(/\/product\/([^/]+)\/?/);
    var id = match ? match[1] : "custom-" + hashText([name, image, url].join("|"));

    if (!name && !image) return null;

    return {
      id: id,
      name: name || "Товар",
      url: url || "#",
      image: image,
      price: price,
      oldPrice: oldPrice
    };
  }

  function setButtonState(trigger, isSaved, productName) {
    trigger.classList.toggle("addwishlist", isSaved);

    var icon = trigger.querySelector(".icon");
    if (icon) {
      icon.classList.toggle("icon-heart", !isSaved);
      icon.classList.toggle("icon-trash", isSaved);
    }

    var tooltipText = isSaved ? "Удалить из избранного" : "В избранное";
    var labelText = isSaved ? "Удалить из избранного" : "Добавить в избранное";

    var tooltip = trigger.querySelector(".tooltip");
    if (tooltip) {
      tooltip.textContent = tooltipText;
    }

    var label = trigger.querySelector(".wishlist-label");
    if (label) {
      label.textContent = isSaved ? "Удалить из избранного" : "В избранное";
    }

    var link = trigger.matches("a") ? trigger : trigger.querySelector("a");
    if (link) link.setAttribute("aria-label", formatProductActionLabel(labelText, productName));
  }

  function syncWishlistButtons() {
    var items = readWishlist();
    var ids = items.map(function (item) {
      return item.id;
    });

    document.querySelectorAll(".card-product .wishlist, .btn-add-wishlist").forEach(function (trigger) {
      var product = getProductFromCard(trigger);
      if (!product) return;
      setButtonState(trigger, ids.indexOf(product.id) !== -1, product.name);
    });
  }

  function renderCard(item) {
    var image = item.image
      ? '<img alt="Товар" class="img-product" height="440" loading="lazy" src="' + escapeHtml(item.image) + '" width="330" />'
      : "";
    var hoverImage = item.image
      ? '<img alt="Товар" class="img-hover" height="440" loading="lazy" src="' + escapeHtml(item.image) + '" width="330" />'
      : "";
    var oldPrice = item.oldPrice
      ? '<span class="price-old text-caption-01 cl-text-3">' + escapeHtml(item.oldPrice) + "</span>"
      : "";

    return (
      '<div class="card-product" data-wishlist-id="' + escapeHtml(item.id) + '">' +
        '<div class="card-product_wrapper">' +
          '<a class="product-img" href="' + escapeHtml(item.url || "#") + '">' +
            image +
            hoverImage +
          "</a>" +
          '<ul class="product-action_list">' +
            '<li><a aria-label="' + escapeHtml(formatProductActionLabel("Смотреть товар", item.name)) + '" class="hover-tooltip tooltip-left box-icon" href="' + escapeHtml(item.url || "#") + '">' +
              '<span class="icon icon-Eye"></span>' +
              '<span class="tooltip">Смотреть товар</span>' +
            "</a></li>" +
          "</ul>" +
          '<button aria-label="' + escapeHtml(formatProductActionLabel("Удалить из избранного", item.name)) + '" class="product-action_remove remove box-icon hover-tooltip tooltip-left" type="button" data-wishlist-remove="' + escapeHtml(item.id) + '">' +
            '<i class="icon icon-trash"></i>' +
            '<span class="tooltip">Удалить</span>' +
          "</button>" +
          '<div class="product-action_bot">' +
            '<a class="tf-btn btn-white small w-100" href="' + escapeHtml(item.url || "#") + '">Смотреть товар</a>' +
          "</div>" +
        "</div>" +
        '<div class="card-product_info">' +
          '<a class="name-product lh-24 fw-medium link-underline-text" href="' + escapeHtml(item.url || "#") + '">' + escapeHtml(item.name) + "</a>" +
          '<div class="star-wrap d-flex align-items-center">' +
            '<i class="icon icon-Star"></i><i class="icon icon-Star"></i><i class="icon icon-Star"></i><i class="icon icon-Star"></i><i class="icon icon-Star"></i>' +
          "</div>" +
          '<div class="price-wrap">' +
            '<span class="price-new text-primary fw-semibold">' + escapeHtml(item.price || "") + "</span>" +
            oldPrice +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderWishlistPage() {
    var root = document.querySelector("[data-wishlist-root]");
    if (!root) return;

    var items = readWishlist();
    if (!items.length) {
      root.innerHTML =
        '<div class="tf-wishlist-empty text-center wd-full" style="grid-column: 1 / -1;">' +
          '<p class="text-notice cl-text-2 mb-20">В избранном пока нет товаров.</p>' +
          '<a href="/" class="tf-btn animate-btn">Перейти к покупкам</a>' +
        "</div>";
      return;
    }

    root.innerHTML = items.map(renderCard).join("");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  document.addEventListener("click", function (event) {
    var remove = event.target.closest("[data-wishlist-remove]");
    if (remove) {
      event.preventDefault();
      var removeId = remove.getAttribute("data-wishlist-remove");
      writeWishlist(readWishlist().filter(function (item) {
        return item.id !== removeId;
      }));
      renderWishlistPage();
      syncWishlistButtons();
      return;
    }

    var trigger = event.target.closest(".card-product .wishlist, .btn-add-wishlist, .btn-wishlist");
    if (!trigger) return;

    var product = getProductFromCard(trigger);
    if (!product) return;

    var items = readWishlist();
    var existingIndex = items.findIndex(function (item) {
      return item.id === product.id;
    });

    if (existingIndex === -1) {
      items.unshift(product);
    } else {
      items.splice(existingIndex, 1);
    }

    writeWishlist(items);

    window.setTimeout(function () {
      syncWishlistButtons();
      renderWishlistPage();
    }, 0);
  });

  document.addEventListener("DOMContentLoaded", function () {
    syncWishlistButtons();
    renderWishlistPage();
  });
})();
