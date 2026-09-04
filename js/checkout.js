function suggestedReference(first, last) {
  const clean = (value) =>
    String(value || "")
      .trim()
      .replace(/\s+/g, "")
      .replace(/[^A-Za-z0-9]/g, "");
  const a = clean(first);
  const b = clean(last);
  if (a && b) return `${a}_${b}`;
  if (a) return a;
  return "Name_Surname";
}

function cartLines() {
  return readCart()
    .map((item) => {
      const product = productById(item.id);
      if (!product) return null;
      return {
        id: product.id,
        name: product.name,
        size: item.size === "OS" ? "One size" : item.size,
        color: colorOf(product, item.color).name,
        qty: lineQty(item),
        price: Number(product.price),
      };
    })
    .filter(Boolean);
}

function cartTotal(lines) {
  return lines.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function deliveryConfig() {
  const root = window.FOUND_CONFIG || {};
  return root.delivery || {};
}

function qualifiesForFreeDelivery(subtotal, province) {
  const cfg = deliveryConfig();
  const allowed = cfg.freeOverProvinces || [];
  return Boolean(
    cfg.freeOver &&
      subtotal >= cfg.freeOver &&
      province &&
      allowed.includes(province)
  );
}

function deliveryFee(subtotal, province) {
  const cfg = deliveryConfig();
  if (!subtotal || !province) return 0;
  if (qualifiesForFreeDelivery(subtotal, province)) return 0;
  const rates = cfg.provinceRates || {};
  if (rates[province] != null) return Number(rates[province]);
  return Number(cfg.flatRate) || 109;
}

function selectedProvince() {
  const form = $("[data-order-form]");
  return form ? form.province.value : "";
}

function renderBankBox() {
  const box = $("[data-bank-box]");
  if (!box || !window.FOUND_CONFIG?.bank) return;
  const bank = window.FOUND_CONFIG.bank;
  box.innerHTML = `
    <div><dt>Account name</dt><dd>${bank.accountName}</dd></div>
    <div><dt>Bank</dt><dd>${bank.bankName}</dd></div>
    <div><dt>Account no.</dt><dd>${bank.accountNumber}</dd></div>
    <div><dt>Branch</dt><dd>${bank.branchCode}</dd></div>
    <div><dt>Type</dt><dd>${bank.accountType}</dd></div>
  `;
}

function renderCheckoutSummary() {
  const root = $("[data-checkout-items]");
  const subtotalEl = $("[data-checkout-subtotal]");
  const deliveryEl = $("[data-checkout-delivery]");
  const totalEl = $("[data-checkout-total]");
  const noteEl = $("[data-delivery-note]");
  if (!root) return;

  const lines = cartLines();
  if (!lines.length) {
    root.innerHTML = `<p class="cart-empty">Your bag is empty. <a class="text-link" href="shop.html">Shop the drop</a></p>`;
    if (totalEl) totalEl.textContent = formatPrice(0);
    return;
  }

  root.innerHTML = lines
    .map(
      (item) => `
      <div class="summary-line">
        <span>${item.qty} × ${item.name} · ${item.color} · ${item.size}</span>
        <span>${formatPrice(item.price * item.qty)}</span>
      </div>
    `
    )
    .join("");

  const subtotal = cartTotal(lines);
  const province = selectedProvince();
  const delivery = deliveryFee(subtotal, province);
  const isFree = qualifiesForFreeDelivery(subtotal, province);
  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (deliveryEl) {
    if (!province) deliveryEl.textContent = "Select province";
    else if (isFree) deliveryEl.textContent = "Free";
    else deliveryEl.textContent = formatPrice(delivery);
  }
  if (totalEl) {
    totalEl.textContent = province
      ? formatPrice(subtotal + delivery)
      : formatPrice(subtotal);
  }

  if (noteEl) {
    const cfg = deliveryConfig();
    if (!province) {
      noteEl.textContent = "Select a province to see the PostNet delivery fee.";
    } else {
      const localFree =
        (cfg.freeOverProvinces || []).includes(province) &&
        cfg.freeOver &&
        subtotal < cfg.freeOver;
      noteEl.textContent = localFree
        ? `Spend ${formatPrice(cfg.freeOver - subtotal)} more for free Western Cape delivery.`
        : cfg.note || "";
    }
  }
}

function showFormError(message) {
  const errorEl = $("[data-form-error]");
  if (!errorEl) return;
  if (!message) {
    errorEl.hidden = true;
    errorEl.textContent = "";
    return;
  }
  errorEl.hidden = false;
  errorEl.textContent = message;
  errorEl.scrollIntoView({ block: "center", behavior: "smooth" });
}

function missingFields(form) {
  const labels = {
    firstName: "first name",
    lastName: "surname",
    email: "email",
    phone: "phone",
    address: "street address",
    city: "city",
    province: "province",
    postal: "postal code",
    country: "country",
    reference: "bank reference",
  };
  return Object.keys(labels).filter((name) => {
    const field = form.elements[name];
    return !field || !String(field.value || "").trim();
  }).map((name) => labels[name]);
}

function updateReferenceUi(form) {
  const first = form.firstName.value;
  const last = form.lastName.value;
  const suggest = suggestedReference(first, last);
  const suggestEl = $("[data-ref-suggest]");
  if (suggestEl) suggestEl.textContent = suggest;

  const input = $("[data-reference]");
  const btn = $("[data-place-order]");
  const warn = $("[data-ref-warn]");
  const value = (input?.value || "").trim();
  const hasRef = value.length >= 3;
  const province = form.elements.province ? form.elements.province.value : "";
  const hasProvince = Boolean(province);
  if (btn) btn.disabled = !(hasRef && hasProvince);
  if (warn) warn.hidden = hasRef || value.length === 0;
}

function saveOrderLocally(payload) {
  const stored = JSON.parse(localStorage.getItem("found-orders") || "[]");
  stored.push({ ...payload, createdAt: new Date().toISOString() });
  localStorage.setItem("found-orders", JSON.stringify(stored));
}

function sendOrderWebhook(payload) {
  const webhook = window.FOUND_CONFIG && window.FOUND_CONFIG.orderWebhook;
  if (!webhook) return Promise.resolve("local");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  return fetch(webhook, {
    method: "POST",
    mode: "no-cors",
    redirect: "follow",
    body: JSON.stringify(payload),
    signal: controller.signal,
  })
    .then(() => "sent")
    .catch(() => "failed")
    .finally(() => clearTimeout(timer));
}

function showOrderDone(payload, emailed) {
  localStorage.setItem(CART_KEY, "[]");
  renderCart();
  const app = $("[data-checkout-app]");
  const done = $("[data-checkout-done]");
  if (app) app.hidden = true;
  if (done) done.hidden = false;
  if ($("[data-done-id]")) $("[data-done-id]").textContent = payload.orderId;
  if ($("[data-done-copy]")) {
    $("[data-done-copy]").textContent = emailed
      ? `A confirmation will be sent to ${payload.email}. We will match your payment using the reference ${payload.reference}.`
      : `Order ${payload.orderId} is saved. If you do not get an email, the order sheet may not be connected yet — keep your reference ${payload.reference}.`;
  }
}

async function submitOrder(form) {
  const btn = $("[data-place-order]");
  const reference = (form.elements.reference.value || "").trim();
  const province = form.elements.province ? form.elements.province.value : "";
  const missing = missingFields(form);

  if (missing.length) {
    const invalid = form.querySelector(":invalid");
    if (invalid && invalid.focus) invalid.focus();
    showFormError("Please fill in: " + missing.join(", ") + ".");
    return;
  }
  if (!province) {
    form.elements.province.focus();
    showFormError("Select a province so delivery can be calculated.");
    return;
  }
  if (reference.length < 3) {
    $("[data-ref-warn]").hidden = false;
    form.elements.reference.focus();
    showFormError("Enter the bank reference you used on the transfer.");
    return;
  }

  const lines = cartLines();
  if (!lines.length) {
    window.location.href = "shop.html";
    return;
  }

  const name = `${form.firstName.value.trim()} ${form.lastName.value.trim()}`.trim();
  const subtotal = cartTotal(lines);
  const delivery = deliveryFee(subtotal, province);
  const total = subtotal + delivery;
  const orderId = `FOUND-${Date.now().toString().slice(-6)}`;
  const payload = {
    orderId,
    name,
    firstName: form.firstName.value.trim(),
    lastName: form.lastName.value.trim(),
    email: form.email.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    city: form.city.value.trim(),
    province,
    postal: form.postal.value.trim(),
    country: form.country.value.trim(),
    notes: form.notes.value.trim(),
    reference,
    payment: "Bank transfer / bank deposit",
    items: lines,
    subtotal,
    delivery,
    total,
  };

  if (btn) {
    btn.disabled = true;
    btn.textContent = "Placing order…";
  }
  showFormError("");

  saveOrderLocally(payload);
  const result = await sendOrderWebhook(payload);
  showOrderDone(payload, result === "sent");
}

function initCheckoutPage() {
  const form = $("[data-order-form]");
  if (!form) return;

  if (!cartLines().length) {
    $("[data-checkout-app]").innerHTML =
      `<p class="cart-empty">Your bag is empty. <a class="text-link" href="shop.html">Shop the drop</a></p>`;
    return;
  }

  renderBankBox();
  renderCheckoutSummary();
  updateReferenceUi(form);

  ["firstName", "lastName", "reference"].forEach((name) => {
    form.elements[name]?.addEventListener("input", () => updateReferenceUi(form));
  });
  const onProvinceChange = () => {
    renderCheckoutSummary();
    updateReferenceUi(form);
  };
  form.elements.province?.addEventListener("change", onProvinceChange);
  form.elements.province?.addEventListener("input", onProvinceChange);

  $("[data-use-suggest]")?.addEventListener("click", () => {
    form.reference.value = suggestedReference(form.firstName.value, form.lastName.value);
    updateReferenceUi(form);
    form.reference.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitOrder(form);
  });
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);
