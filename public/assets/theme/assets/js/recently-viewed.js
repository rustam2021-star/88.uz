(function () {
  "use strict";

  var STORAGE_KEY = "88uz:recently-viewed:v1";
  var MAX_STORED = 12;
  var MAX_VISIBLE = 4;

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readItems() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(parsed) ? parsed.filter(function (item) {
        return item && item.id && item.url && item.name;
      }) : [];
    } catch (error) {
      return [];
    }
  }

  function writeItems(items) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_STORED)));
    } catch (error) {
      // Browsing history is optional when storage is unavailable.
    }
  }

  function renderCard(item) {
    var hoverImage = item.hoverImage || item.image;
    var oldPrice = item.oldPrice
      ? '<span class="price-old text-caption-01 cl-text-3">' + escapeHtml(item.oldPrice) + '</span>'
      : "";
    var availability = item.inStock ? "В наличии у продавца" : "Наличие уточняется";

    return (
      '<div class="swiper-slide"><div class="card-product">' +
        '<div class="card-product_wrapper">' +
          '<a class="product-img" href="' + escapeHtml(item.url) + '">' +
            '<img alt="' + escapeHtml(item.name) + ', основное изображение" class="img-product" height="440" loading="lazy" sizes="(max-width: 575px) 46vw, (max-width: 1199px) 30vw, 330px" src="' + escapeHtml(item.image) + '" width="330" />' +
            '<img alt="' + escapeHtml(item.name) + ', вид при наведении" class="img-hover" height="440" loading="lazy" sizes="(max-width: 575px) 46vw, (max-width: 1199px) 30vw, 330px" src="' + escapeHtml(hoverImage) + '" width="330" />' +
          '</a>' +
          '<ul class="product-action_list">' +
            '<li class="wishlist"><a aria-label="Добавить в избранное: ' + escapeHtml(item.name) + '" class="hover-tooltip tooltip-left box-icon" href="#;"><span class="icon icon-heart"></span><span class="tooltip">В избранное</span></a></li>' +
            '<li><a aria-label="Смотреть товар: ' + escapeHtml(item.name) + '" class="hover-tooltip tooltip-left box-icon" href="' + escapeHtml(item.url) + '"><span class="icon icon-Eye"></span><span class="tooltip">Смотреть товар</span></a></li>' +
          '</ul>' +
          '<div class="product-action_bot"><a class="tf-btn btn-white small w-100" href="' + escapeHtml(item.orderUrl) + '" rel="noopener" target="_blank">Заказать</a></div>' +
        '</div>' +
        '<div class="card-product_info">' +
          '<a class="name-product lh-24 fw-medium link-underline-text" href="' + escapeHtml(item.url) + '">' + escapeHtml(item.name) + '</a>' +
          '<div class="star-wrap d-flex align-items-center"><i class="icon icon-Star"></i><i class="icon icon-Star"></i><i class="icon icon-Star"></i><i class="icon icon-Star"></i><i class="icon icon-Star"></i></div>' +
          '<div class="price-wrap"><span class="price-new text-primary fw-semibold">' + escapeHtml(item.price) + '</span>' + oldPrice + '</div>' +
          '<p class="text-caption-01 cl-text-2">' + escapeHtml(item.brand) + ' · ' + availability + '</p>' +
        '</div>' +
      '</div></div>'
    );
  }

  var payload = document.getElementById("recently-viewed-product");
  var container = document.querySelector("[data-recently-products]");
  var tab = document.querySelector("[data-recently-tab]");

  if (!payload || !container || !tab) return;

  try {
    var current = JSON.parse(payload.textContent || "{}");
    var stored = readItems().filter(function (item) {
      return item.id !== current.id;
    });
    var visible = stored.slice(0, MAX_VISIBLE);

    if (visible.length) {
      container.innerHTML = visible.map(renderCard).join("");
      tab.hidden = false;
    }

    writeItems([current].concat(stored));
  } catch (error) {
    // Keep the optional tab hidden if its data cannot be parsed.
  }
})();
