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
        qty: item.qty,
        price: product.price,
      };
    })
    .filter(Boolean);
}

function cartTotal(lines) {
  return lines.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderBankBox() {
  const box = $("[data-bank-box]");
  if (!box || !window.FOUND_CONFIG) return;
  const bank = FOUND_CONFIG.bank;
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
  const totalEl = $("[data-checkout-total]");
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
  if (totalEl) totalEl.textContent = formatPrice(cartTotal(lines));
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
  const ok = value.length >= 3;
  if (btn) btn.disabled = !ok;
  if (warn) warn.hidden = ok || value.length === 0;
}

async function submitOrder(form) {
  const errorEl = $("[data-form-error]");
  const btn = $("[data-place-order]");
  const reference = form.reference.value.trim();
  if (reference.length < 3) {
    $("[data-ref-warn]").hidden = false;
    form.reference.focus();
    return;
  }

  const lines = cartLines();
  if (!lines.length) {
    window.location.href = "shop.html";
    return;
  }

  const name = `${form.firstName.value.trim()} ${form.lastName.value.trim()}`.trim();
  const total = cartTotal(lines);
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
    province: form.province.value,
    postal: form.postal.value.trim(),
    country: form.country.value.trim(),
    notes: form.notes.value.trim(),
    reference,
    payment: "Bank transfer / bank deposit",
    items: lines,
    total,
  };

  btn.disabled = true;
  btn.textContent = "Placing order…";
  if (errorEl) errorEl.hidden = true;

  const webhook = window.FOUND_CONFIG?.orderWebhook;

  try {
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } else {
      const stored = JSON.parse(localStorage.getItem("found-orders") || "[]");
      stored.push({ ...payload, createdAt: new Date().toISOString() });
      localStorage.setItem("found-orders", JSON.stringify(stored));
    }

    localStorage.setItem(CART_KEY, "[]");
    renderCart();
    $("[data-checkout-app]").hidden = true;
    const done = $("[data-checkout-done]");
    done.hidden = false;
    $("[data-done-id]").textContent = orderId;
    $("[data-done-copy]").textContent =
      `A confirmation will be sent to ${payload.email}. We will match your payment using the reference ${reference}.`;
  } catch (err) {
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent =
        "The order could not be sent. Check your connection and try again.";
    }
    btn.disabled = false;
    btn.textContent = "Place order";
  }
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

  form.firstName.addEventListener("input", () => updateReferenceUi(form));
  form.lastName.addEventListener("input", () => updateReferenceUi(form));
  form.reference.addEventListener("input", () => updateReferenceUi(form));

  $("[data-use-suggest]")?.addEventListener("click", () => {
    form.reference.value = suggestedReference(form.firstName.value, form.lastName.value);
    updateReferenceUi(form);
    form.reference.focus();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) {
      if (!form.reference.value.trim()) $("[data-ref-warn]").hidden = false;
      return;
    }
    submitOrder(form);
  });
}

document.addEventListener("DOMContentLoaded", initCheckoutPage);
