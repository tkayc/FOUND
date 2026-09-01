const PRODUCTS = [
  {
    id: "essential-tee",
    name: "F. Essential Tee",
    price: 499,
    category: "tops",
    color: "Cream",
    blurb: "Quietly made. Intentionally worn.",
    description:
      "A heavyweight cotton tee, cut oversized and finished without noise. The foundation of Drop 001 — made to be worn often, and well.",
    details: ["Heavyweight cotton", "Oversized fit", "Cream", "Limited drop"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "assets/product-essential-tee.jpg",
      "assets/essential-lifestyle.jpg",
      "assets/hero-campaign.jpg",
    ],
  },
  {
    id: "faith-tee",
    name: "Woven By Faith Tee",
    price: 499,
    category: "tops",
    color: "Black",
    blurb: "Woven by faith.",
    description:
      "The same essential cut, in black. A quieter statement — faith held close, purpose worn lightly.",
    details: ["Heavyweight cotton", "Oversized fit", "Black", "Limited drop"],
    sizes: ["S", "M", "L", "XL"],
    images: [
      "assets/product-faith-tee.jpg",
      "assets/editorial-01.jpg",
      "assets/fabric-detail.jpg",
    ],
  },
  {
    id: "cap",
    name: "FOUND Cap",
    price: 270,
    category: "accessories",
    color: "Cream",
    blurb: "Built to leave a legacy.",
    description:
      "An unstructured cotton cap in cream. Soft structure, unbranded face — made to live with the rest of the drop.",
    details: ["Unstructured cotton", "One size", "Cream", "Limited drop"],
    sizes: ["OS"],
    images: [
      "assets/product-cap.jpg",
      "assets/editorial-02.jpg",
      "assets/story-atelier.jpg",
    ],
  },
];

const CART_KEY = "found-cart";
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const formatPrice = (value) => `R${value.toLocaleString("en-ZA")}`;

const readCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

const writeCart = (cart) => {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
};

const cartCount = () => readCart().reduce((sum, item) => sum + item.qty, 0);

const addToCart = (id, size) => {
  const cart = readCart();
  const existing = cart.find((item) => item.id === id && item.size === size);
  if (existing) existing.qty += 1;
  else cart.push({ id, size, qty: 1 });
  writeCart(cart);
  openCart();
};

const updateQty = (id, size, delta) => {
  const cart = readCart()
    .map((item) =>
      item.id === id && item.size === size
        ? { ...item, qty: item.qty + delta }
        : item
    )
    .filter((item) => item.qty > 0);
  writeCart(cart);
};

const removeItem = (id, size) => {
  writeCart(readCart().filter((item) => !(item.id === id && item.size === size)));
};

const productById = (id) => PRODUCTS.find((item) => item.id === id);

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
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  body.innerHTML = cart
    .map((item) => {
      const product = productById(item.id);
      if (!product) return "";
      return `
        <article class="cart-item">
          <img src="${product.images[0]}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <p>${item.size === "OS" ? "One size" : item.size} · ${formatPrice(product.price)}</p>
            <button class="remove-item" data-remove="${product.id}" data-size="${item.size}">Remove</button>
          </div>
          <div class="qty">
            <button data-qty="${product.id}" data-size="${item.size}" data-delta="-1" aria-label="Decrease">−</button>
            <span>${item.qty}</span>
            <button data-qty="${product.id}" data-size="${item.size}" data-delta="1" aria-label="Increase">+</button>
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
  const items = PRODUCTS.filter(
    (item) => filter === "all" || item.category === filter
  );
  root.innerHTML = items
    .map(
      (item) => `
      <a class="product-card in-view" href="product.html?id=${item.id}">
        <div class="product-card__media">
          <img src="${item.images[0]}" alt="${item.name}">
        </div>
        <div class="product-card__meta">
          <p class="product-card__name">${item.name}</p>
          <p class="product-card__price">${formatPrice(item.price)}</p>
        </div>
      </a>
    `
    )
    .join("");
  observeInView();
}

function initProductPage() {
  const root = $("[data-pdp]");
  if (!root) return;
  const id = new URLSearchParams(window.location.search).get("id") || "essential-tee";
  const product = productById(id) || PRODUCTS[0];
  let selectedSize = product.sizes.length === 1 ? product.sizes[0] : null;

  $("[data-pdp-name]").textContent = product.name;
  $("[data-pdp-price]").textContent = formatPrice(product.price);
  $("[data-pdp-desc]").textContent = product.description;
  $("[data-pdp-main]").src = product.images[0];
  $("[data-pdp-main]").alt = product.name;
  document.title = `${product.name} — FOUND. THREADS`;

  $("[data-pdp-details]").innerHTML = product.details
    .map((line) => `<li>${line}</li>`)
    .join("");

  $("[data-pdp-thumbs]").innerHTML = product.images
    .map(
      (src, index) => `
      <button type="button" class="${index === 0 ? "is-active" : ""}" data-thumb="${src}">
        <img src="${src}" alt="">
      </button>
    `
    )
    .join("");

  $("[data-size-options]").innerHTML = product.sizes
    .map((size) => {
      const label = size === "OS" ? "OS" : size;
      return `<button type="button" data-size="${size}" class="${
        selectedSize === size ? "is-active" : ""
      }">${label}</button>`;
    })
    .join("");

  $("[data-pdp-thumbs]").addEventListener("click", (event) => {
    const btn = event.target.closest("[data-thumb]");
    if (!btn) return;
    $("[data-pdp-main]").src = btn.dataset.thumb;
    $$("[data-thumb]").forEach((el) => el.classList.toggle("is-active", el === btn));
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

  $("[data-add]").addEventListener("click", () => {
    if (!selectedSize) {
      $(".size-row")?.classList.add("is-error");
      return;
    }
    addToCart(product.id, selectedSize);
  });
}

function initCheckout() {
  const start = $("[data-checkout-start]");
  const form = $("[data-checkout-form]");
  if (!start || !form) return;

  start.addEventListener("click", () => {
    if (!readCart().length) return;
    start.hidden = true;
    form.style.display = "flex";
    form.classList.add("is-visible");
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    localStorage.setItem(CART_KEY, "[]");
    $$("[data-bag-count]").forEach((el) => {
      el.textContent = "0";
    });
    const body = $("[data-cart-body]");
    const foot = $("[data-cart-foot]");
    if (body) {
      body.innerHTML = `
        <div class="order-confirm" style="display:block">
          <h3>Received.</h3>
          <p>A member of FOUND will confirm your order shortly.</p>
        </div>
      `;
    }
    if (foot) foot.hidden = true;
    form.style.display = "none";
    start.hidden = false;
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
    updateQty(qtyBtn.dataset.qty, qtyBtn.dataset.size, Number(qtyBtn.dataset.delta));
  }

  const removeBtn = event.target.closest("[data-remove]");
  if (removeBtn) removeItem(removeBtn.dataset.remove, removeBtn.dataset.size);
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
