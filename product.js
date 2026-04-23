(function () {
  "use strict";

  var CATALOG = {
    green: {
      title: "Купон в Green",
      subtitle: "Продуктовый магазин",
      image: "images/1400x1400-1226222-1644526919957.jpg",
      imageAlt: "Продуктовый магазин Green",
      price: 19999,
      description: "Скидочный купон на 50 рублей в сети продуктовых магазинов Green."
    },
    ozby: {
      title: "Сертификат OZ.by",
      subtitle: "Книги и канцелярия",
      image: "images/101085345_3.jpg",
      imageAlt: "Книжный магазин",
      price: 9999,
      description: "Сертификат на 25 рублей в интернет-магазине OZ.by на книги, канцелярию и другие товары."
    },
    cactus: {
      title: "Опция Кактус",
      subtitle: "Дополнительная опция по карте",
      image: "images/mtbank_kartuspleaser_1200x900_s13.jpg",
      imageAlt: "Банковская карта с опциями",
      price: 3499,
      description: "Подключение опции 'Кактус' по вашей карте на 1 месяц. Узнайте подробности в приложении МТБанка."
    },
    apple: {
      title: "Сертификат в Золотое Яблоко",
      subtitle: "Косметика",
      image: "images/yMmI2oRm6qH0xQxjU7J8FHPazdxgxOgOJkVJxl34.png",
      imageAlt: "Подарочная карта",
      price: 19999,
      description: "Подарочная карта на 50 на покупки в сети косметики 'Золотое Яблоко'."
    },
    "21vek": {  // новый товар
    title: "Сертификат 21vek.by",
    subtitle: "Электроника и техника",
    image: "images/e83eaeade7f423205c78040807c235ab.gif",
    imageAlt: "Интернет-магазин 21vek.by",
    price: 39999,
    description: "Сертификат на 100 рублей в интернет-магазине 21vek.by. Огромный выбор электроники, бытовой техники и товаров для дома."
  }
  };

  function checkAuth() {
    var userRaw = localStorage.getItem("rr_current_user_id");
    if (!userRaw) {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  function formatMtbanks(n) {
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  }

  function init() {
    if (!checkAuth()) return;

    var key = new URLSearchParams(window.location.search).get("p");
    var item = CATALOG[key];
    if (!item) {
      window.location.replace("index.html");
      return;
    }

    var img = document.getElementById("product-image");
    var titleEl = document.getElementById("product-title");
    var subtitleEl = document.getElementById("product-subtitle");
    var priceDigits = document.getElementById("product-price-digits");
    var descEl = document.getElementById("product-description");
    var buyBtn = document.getElementById("btn-buy");
    var toast = document.getElementById("buy-toast");

    if (img) {
      img.src = item.image;
      img.alt = item.imageAlt;
    }
    if (titleEl) titleEl.textContent = item.title;
    if (subtitleEl) subtitleEl.textContent = item.subtitle;
    if (descEl) descEl.textContent = item.description;
    document.title = item.title + " — Магазин";

    if (priceDigits) priceDigits.textContent = formatMtbanks(item.price);

    if (buyBtn && toast) {
      buyBtn.addEventListener("click", function () {
        toast.textContent = "Покупка скоро будет доступна. Цена: " + formatMtbanks(item.price) + " MTBank Tokens";
        toast.classList.add("is-visible");
        window.setTimeout(function () {
          toast.classList.remove("is-visible");
        }, 2800);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();