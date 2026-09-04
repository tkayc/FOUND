const PRODUCTS = [
  {
    id: "essential-tee",
    name: "The F. Essential Tee",
    price: 549,
    category: "tops",
    featured: true,
    drop: "Drop 001",
    sizes: ["M", "L", "XL", "2XL"],
    details:
      "Heavyweight cotton crew neck with the F. mark on the chest. Quietly made for daily wear. Available in Black, Cream and Chocolate.",
    sizeFit:
      "Oversized essential fit. M, L, XL and 2XL. If you are between sizes, take the larger size.",
    delivery:
      "Orders are confirmed after your bank transfer is matched to your reference. Delivery within South Africa follows once payment is verified. Returns are accepted on unused items in original condition within 7 days of delivery.",
    colors: [
      {
        id: "black",
        name: "Black",
        images: [
          "images/black_tee_front.jpeg",
          "images/F_essential.t_black_logo.jpeg",
          "images/black_tee.jpeg",
          "images/black_tee_back.jpeg",
        ],
      },
      {
        id: "cream",
        name: "Cream",
        images: [
          "images/colar_cream.tee.jpeg",
          "images/cream_tee_grid.jpeg",
          "images/tees.jpeg",
          "images/tees and caps.jpeg",
        ],
      },
      {
        id: "chocolate",
        name: "Chocolate",
        images: [
          "images/chocolate tee .jpeg",
          "images/WhatsApp Image 2026-09-03 at 08.32.07 (1).jpeg",
          "images/choc_tee walk.jpeg",
          "images/choc_tee back.jpeg",
        ],
      },
    ],
  },
  {
    id: "faith-tee",
    name: "The Woven By Faith Tee",
    price: 549,
    category: "tops",
    featured: true,
    drop: "Drop 001",
    sizes: ["M", "L", "XL", "2XL"],
    details:
      "Heavyweight cotton with WOVEN BY FAITH across the chest. The same essential cut, made to be worn with intention.",
    sizeFit:
      "Oversized essential fit. M, L, XL and 2XL. If you are between sizes, take the larger size.",
    delivery:
      "Orders are confirmed after your bank transfer is matched to your reference. Delivery within South Africa follows once payment is verified. Returns are accepted on unused items in original condition within 7 days of delivery.",
    colors: [
      {
        id: "black",
        name: "Black",
        images: [
          "images/cream and black tees.jpeg",
          "images/black_tee_back.jpeg",
          "images/tees.jpeg",
          "images/tees and caps.jpeg",
        ],
      },
      {
        id: "cream",
        name: "Cream",
        images: [
          "images/cream_tee_grid.jpeg",
          "images/cream and black tees.jpeg",
          "images/colar_cream.tee.jpeg",
          "images/tees.jpeg",
        ],
      },
      {
        id: "chocolate",
        name: "Chocolate",
        images: [
          "images/chocolate tee .jpeg",
          "images/choc_tee back.jpeg",
          "images/tees.jpeg",
          "images/WhatsApp Image 2026-09-03 at 08.32.07 (3).jpeg",
        ],
      },
    ],
  },
  {
    id: "cap",
    name: "The F. Essential Cap",
    price: 299,
    category: "accessories",
    featured: true,
    drop: "Drop 001",
    sizes: ["OS"],
    details:
      "Structured cotton cap with the F. mark or WOVEN BY FAITH. Made to sit with the rest of Drop 001.",
    sizeFit: "One size. Adjustable back strap.",
    delivery:
      "Orders are confirmed after your bank transfer is matched to your reference. Delivery within South Africa follows once payment is verified. Returns are accepted on unused items in original condition within 7 days of delivery.",
    colors: [
      {
        id: "black",
        name: "Black",
        images: [
          "images/black cap.jpeg",
          "images/black_tee_front.jpeg",
          "images/caps and tees.jpeg",
        ],
      },
      {
        id: "cream",
        name: "Cream",
        images: [
          "images/WhatsApp Image 2026-09-03 at 08.32.07 (4).jpeg",
          "images/WhatsApp Image 2026-09-03 at 08.32.07 (6).jpeg",
          "images/tees and caps.jpeg",
        ],
      },
      {
        id: "chocolate",
        name: "Chocolate",
        images: [
          "images/teez and capz.jpeg",
          "images/caps and tees.jpeg",
          "images/tees and caps.jpeg",
        ],
      },
    ],
  },
  {
    id: "drop-001-set",
    name: "Drop 001 Set",
    price: 799,
    category: "sets",
    featured: false,
    drop: "Drop 001",
    blurb: "Tee + Cap",
    sizes: ["M", "L", "XL", "2XL"],
    details:
      "The Drop 001 set: one tee and one cap. Choose your colourway. Tee size is M, L, XL or 2XL. Cap is one size.",
    sizeFit: "Tee: oversized essential fit. Cap: one size, adjustable.",
    delivery:
      "Orders are confirmed after your bank transfer is matched to your reference. Delivery within South Africa follows once payment is verified. Returns are accepted on unused items in original condition within 7 days of delivery.",
    colors: [
      {
        id: "black",
        name: "Black",
        images: [
          "images/caps and tees.jpeg",
          "images/black_tee_front.jpeg",
          "images/black cap.jpeg",
          "images/tees and caps.jpeg",
        ],
      },
      {
        id: "cream",
        name: "Cream",
        images: [
          "images/tees and caps.jpeg",
          "images/cream and black tees.jpeg",
          "images/WhatsApp Image 2026-09-03 at 08.32.07 (4).jpeg",
        ],
      },
      {
        id: "chocolate",
        name: "Chocolate",
        images: [
          "images/teez and capz.jpeg",
          "images/chocolate tee .jpeg",
          "images/WhatsApp Image 2026-09-03 at 08.32.07 (6).jpeg",
        ],
      },
    ],
  },
];

const CART_KEY = "found-cart";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const formatPrice = (value) => `R${value}`;

const assetUrl = (src) =>
  String(src)
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");

const productById = (id) => PRODUCTS.find((item) => item.id === id);

const colorOf = (product, colorId) =>
  product.colors.find((c) => c.id === colorId) || product.colors[0];

const productThumb = (product, colorId) => colorOf(product, colorId).images[0];

const lineQty = (item) => clampQty(item && item.qty);

const lineTotal = (product, item) => Number(product.price) * lineQty(item);

const readCart = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((item) => item && item.id)
      .map((item) => ({
        id: item.id,
        size: item.size || "",
        color: item.color || "",
        qty: clampQty(item.qty),
      }));
  } catch {
    return [];
  }
};

const writeCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
};

const cartCount = () => readCart().reduce((sum, item) => sum + item.qty, 0);

const clampQty = (value) => Math.max(1, Math.min(20, Number(value) || 1));

const sameLine = (item, id, size, color) =>
  item.id === id && item.size === size && item.color === color;

const addToCart = (id, size, qty = 1, color = "") => {
  const amount = clampQty(qty);
  const cart = readCart();
  const existing = cart.find((item) => sameLine(item, id, size, color));
  if (existing) existing.qty = clampQty(existing.qty + amount);
  else cart.push({ id, size, color, qty: amount });
  writeCart(cart);
  openCart();
};

const updateQty = (id, size, color, delta) => {
  const step = Number(delta);
  if (!Number.isFinite(step) || step === 0) return;
  const cart = readCart()
    .map((item) => {
      if (!sameLine(item, id, size, color)) return item;
      return { ...item, qty: item.qty + step };
    })
    .filter((item) => item.qty > 0)
    .map((item) => ({ ...item, qty: clampQty(item.qty) }));
  writeCart(cart);
};

const removeItem = (id, size, color) => {
  writeCart(readCart().filter((item) => !sameLine(item, id, size, color)));
};

function renderCart() {
  const countEls = $$("[data-bag-count]");
  const count = cartCount();
  countEls.forEach((el) => {
    el.textContent = count;
  });

  const body = $("[data-cart-body]");
  const foot = $("[data-cart-foot]");
  if (!body) return;

  const cart = readCart();
  if (!cart.length) {
    body.innerHTML = `<p class="cart-empty">Your bag is empty.</p>`;
    if (foot) foot.hidden = true;
    return;
  }

  if (foot) foot.hidden = false;
  const subtotal = cart.reduce((sum, item) => {
    const product = productById(item.id);
    return sum + (product ? lineTotal(product, item) : 0);
  }, 0);

  body.innerHTML = cart
    .map((item) => {
      const product = productById(item.id);
      if (!product) return "";
      const color = colorOf(product, item.color);
      const sizeLabel = item.size === "OS" ? "One size" : item.size;
      const qty = lineQty(item);
      return `
        <article class="cart-item">
          <img src="${assetUrl(productThumb(product, item.color))}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <p>${color.name} · ${sizeLabel}</p>
            <p>${qty} × ${formatPrice(product.price)}</p>
            <button class="remove-item" data-remove="${product.id}" data-size="${item.size}" data-color="${item.color}">Remove</button>
          </div>
          <div class="cart-item__aside">
            <p class="cart-item__total">${formatPrice(lineTotal(product, item))}</p>
            <div class="qty">
              <button data-qty="${product.id}" data-size="${item.size}" data-color="${item.color}" data-delta="-1" aria-label="Decrease">−</button>
              <span>${qty}</span>
              <button data-qty="${product.id}" data-size="${item.size}" data-color="${item.color}" data-delta="1" aria-label="Increase">+</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  const subtotalEl = $("[data-subtotal]");
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
}

function openCart() {
  $(".cart")?.classList.add("is-open");
  $(".cart-backdrop")?.classList.add("is-open");
  document.body.classList.add("is-locked");
}

function closeCart() {
  $(".cart")?.classList.remove("is-open");
  $(".cart-backdrop")?.classList.remove("is-open");
  if (!$(".mobile-nav")?.classList.contains("is-open")) {
    document.body.classList.remove("is-locked");
  }
}

function openMenu() {
  $(".mobile-nav")?.classList.add("is-open");
  document.body.classList.add("is-locked");
}

function closeMenu() {
  $(".mobile-nav")?.classList.remove("is-open");
  if (!$(".cart")?.classList.contains("is-open")) {
    document.body.classList.remove("is-locked");
  }
}

function renderProductGrid(target, filter = "all") {
  const root = $(target);
  if (!root) return;
  const featuredOnly = root.hasAttribute("data-home-grid");
  const items = PRODUCTS.filter((item) => {
    if (featuredOnly) return item.featured;
    return filter === "all" || item.category === filter;
  });
  root.innerHTML = items
    .map((item) => {
      const extra = item.blurb
        ? `<p class="product-card__blurb">${item.blurb}</p>`
        : "";
      return `
      <a class="product-card in-view" href="product.html?id=${item.id}">
        <div class="product-card__media">
          <img src="${assetUrl(item.colors[0].images[0])}" alt="${item.name}">
        </div>
        <div class="product-card__meta">
          <p class="product-card__name">${item.name}</p>
          ${extra}
          <p class="product-card__price">${formatPrice(item.price)}</p>
        </div>
      </a>
    `;
    })
    .join("");
  observeInView();
}

function setGallery(product, colorId) {
  const images = colorOf(product, colorId).images;
  $("[data-pdp-main]").src = assetUrl(images[0]);
  $("[data-pdp-main]").alt = product.name;
  $("[data-pdp-thumbs]").innerHTML = images
    .map(
      (src, index) => `
      <button type="button" class="${index === 0 ? "is-active" : ""}" data-thumb="${assetUrl(src)}">
        <img src="${assetUrl(src)}" alt="">
      </button>
    `
    )
    .join("");
}

function initProductPage() {
  const root = $("[data-pdp]");
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get("id") || "essential-tee";
  const product = productById(id) || PRODUCTS[0];
  let selectedSize = product.sizes.length === 1 ? product.sizes[0] : null;
  let selectedColor = product.colors[0].id;

  $("[data-pdp-name]").textContent = product.name;
  $("[data-pdp-price]").textContent = formatPrice(product.price);
  $("[data-pdp-drop]").textContent = product.drop;
  document.title = `${product.name} — FOUND.`;

  const details = $("[data-acc-details]");
  const sizeFit = $("[data-acc-fit]");
  const delivery = $("[data-acc-delivery]");
  if (details) details.textContent = product.details;
  if (sizeFit) sizeFit.textContent = product.sizeFit;
  if (delivery) delivery.textContent = product.delivery;

  $("[data-color-options]").innerHTML = product.colors
    .map(
      (color, index) => `
      <button type="button" data-color="${color.id}" class="${index === 0 ? "is-active" : ""}">
        ${color.name}
      </button>
    `
    )
    .join("");

  $("[data-size-options]").innerHTML = product.sizes
    .map((size) => {
      const label = size === "OS" ? "One size" : size;
      return `<button type="button" data-size="${size}" class="${
        selectedSize === size ? "is-active" : ""
      }">${label}</button>`;
    })
    .join("");

  setGallery(product, selectedColor);

  $("[data-pdp-thumbs]").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-thumb]");
    if (!btn) return;
    $("[data-pdp-main]").src = btn.dataset.thumb;
    $$("[data-thumb]").forEach((el) => el.classList.toggle("is-active", el === btn));
  });

  $("[data-color-options]").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-color]");
    if (!btn) return;
    selectedColor = btn.dataset.color;
    $$("[data-color]", $("[data-color-options]")).forEach((el) =>
      el.classList.toggle("is-active", el === btn)
    );
    setGallery(product, selectedColor);
  });

  $("[data-size-options]").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-size]");
    if (!btn) return;
    selectedSize = btn.dataset.size;
    $$("[data-size]", $("[data-size-options]")).forEach((el) =>
      el.classList.toggle("is-active", el === btn)
    );
    $(".size-row")?.classList.remove("is-error");
  });

  $$("[data-acc]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest("[data-acc-item]");
      const open = item.classList.contains("is-open");
      $$("[data-acc-item]").forEach((el) => el.classList.remove("is-open"));
      if (!open) item.classList.add("is-open");
    });
  });

  const qtyInput = $("[data-pdp-qty-input]");
  const readQty = () => clampQty(qtyInput?.value);
  const writeQty = (value) => {
    if (qtyInput) qtyInput.value = String(clampQty(value));
  };

  root.addEventListener("click", (event) => {
    const step = event.target.closest("[data-pdp-qty]");
    if (!step) return;
    writeQty(readQty() + Number(step.dataset.pdpQty));
  });

  qtyInput?.addEventListener("change", () => writeQty(qtyInput.value));

  $("[data-add]").addEventListener("click", () => {
    if (!selectedSize) {
      $(".size-row")?.classList.add("is-error");
      return;
    }
    addToCart(product.id, selectedSize, readQty(), selectedColor);
  });
}

function initCheckout() {
  const start = $("[data-checkout-start]");
  if (!start) return;
  start.addEventListener("click", () => {
    if (!readCart().length) return;
    window.location.href = "checkout.html";
  });
}

function initHeader() {
  const header = $(".site-header");
  if (!header) return;
  if (header.dataset.solid === "true") {
    header.classList.add("is-solid");
  }
}

function observeInView() {
  const els = $$(".in-view");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );
  els.forEach((el) => io.observe(el));
}

function finishPreloader(preloader) {
  if (preloader.classList.contains("is-done")) return;
  preloader.classList.add("is-done");
  document.body.classList.remove("is-locked");
  $$(".reveal").forEach((el) => el.classList.add("is-ready"));
}

function initPreloader() {
  const preloader = $(".preloader");
  if (!preloader) {
    $$(".reveal").forEach((el) => el.classList.add("is-ready"));
    return;
  }
  window.addEventListener("load", () => {
    setTimeout(() => finishPreloader(preloader), 1500);
  });
  setTimeout(() => finishPreloader(preloader), 2800);
}

function initNewsletter() {
  const form = $("[data-newsletter]");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    form.innerHTML = `<p class="thanks">You are on the list.</p>`;
  });
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-open-cart]")) openCart();
  if (event.target.closest("[data-close-cart]")) closeCart();
  if (event.target.closest("[data-open-menu]")) openMenu();
  if (event.target.closest("[data-close-menu]")) closeMenu();

  const qtyBtn = event.target.closest("[data-qty]");
  if (qtyBtn) {
    updateQty(
      qtyBtn.dataset.qty,
      qtyBtn.dataset.size,
      qtyBtn.dataset.color,
      Number(qtyBtn.dataset.delta)
    );
  }

  const removeBtn = event.target.closest("[data-remove]");
  if (removeBtn) {
    removeItem(removeBtn.dataset.remove, removeBtn.dataset.size, removeBtn.dataset.color);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeCart();
    closeMenu();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  initPreloader();
  initHeader();
  initProductPage();
  initCheckout();
  initNewsletter();
  renderCart();
  observeInView();

  if ($("[data-home-grid]")) renderProductGrid("[data-home-grid]");
  if ($("[data-shop-grid]")) {
    renderProductGrid("[data-shop-grid]");
    $$("[data-filter]").forEach((btn) => {
      btn.addEventListener("click", () => {
        $$("[data-filter]").forEach((el) => el.classList.remove("is-active"));
        btn.classList.add("is-active");
        renderProductGrid("[data-shop-grid]", btn.dataset.filter);
      });
    });
  }
});
