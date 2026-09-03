/**
 * FOUND. — Orders
 *
 * Sends a branded confirmation to the customer, a notification to the studio,
 * and logs every order to the sheet.
 *
 * Setup
 * 1. Create a Google Sheet named FOUND Orders.
 * 2. Extensions > Apps Script. Paste this file. (Runtime must be V8, the default.)
 * 3. Fill in OWNER_EMAIL, BRAND and BANK below.
 * 4. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into js/config.js as orderWebhook.
 */

/* ------------------------------------------------------------------ *
 * Settings — edit these
 * ------------------------------------------------------------------ */

const OWNER_EMAIL = "orders@foundthreads.co.za";
const SHEET_NAME = "Orders";
const TIMEZONE = "Africa/Johannesburg";

const BRAND = {
  name: "FOUND.",
  tagline: "Woven by faith.",
  city: "Cape Town, South Africa",
  email: "orders@foundthreads.co.za",
  phone: "", // e.g. "+27 82 000 0000" — leave blank to hide
  website: "", // e.g. "https://found.co.za" — leave blank to hide
  instagram: "", // e.g. "@found" — leave blank to hide
  senderName: "FOUND.", // the From name the customer sees
  signOff: "The FOUND. Team",
  logoFileId: "", // optional: Google Drive file id of a logo image
};

// Must match the details in js/config.js
const BANK = {
  accountName: "MR PROSPER T SIGAMFELA",
  bankName: "Capitec",
  accountNumber: "2504570844",
  branchCode: "470010",
  accountType: "Savings",
};

const COLOR = {
  ink: "#0B0B0B",
  cream: "#F3EFE7",
  ivory: "#FAF7F2",
  line: "#E0D9CE",
  muted: "#6F6A63",
  body: "#2A2622",
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

function esc_(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function money_(value) {
  return "R" + Number(value || 0);
}

function today_() {
  return Utilities.formatDate(new Date(), TIMEZONE, "d MMMM yyyy");
}

function variantOf_(item) {
  const parts = [];
  if (item.color) parts.push(item.color);
  if (item.size) parts.push(item.size);
  return parts.join(" · ");
}

function logoBlob_() {
  if (!BRAND.logoFileId) return null;
  try {
    return DriveApp.getFileById(BRAND.logoFileId).getBlob().setName("logo");
  } catch (err) {
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Sheet
 * ------------------------------------------------------------------ */

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      "Timestamp",
      "Order ID",
      "Name",
      "Email",
      "Phone",
      "Address",
      "City",
      "Province",
      "Postal code",
      "Country",
      "Items",
      "Total",
      "Payment",
      "Bank reference",
      "Status",
      "Notes",
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* ------------------------------------------------------------------ *
 * Email building blocks
 * ------------------------------------------------------------------ */

function emailHead_(title) {
  const logo = BRAND.logoFileId
    ? '<img src="cid:logo" width="86" alt="' +
      esc_(BRAND.name) +
      '" style="display:block;margin:0 auto 14px;border:0;">'
    : "";

  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    "<title>" +
    esc_(title) +
    "</title></head>" +
    '<body style="margin:0;padding:0;background:' +
    COLOR.cream +
    ';">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' +
    COLOR.cream +
    ';">' +
    '<tr><td align="center" style="padding:28px 12px;">' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;">' +
    // Masthead
    '<tr><td align="center" style="background:' +
    COLOR.ink +
    ';padding:34px 24px 30px;">' +
    logo +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:26px;letter-spacing:8px;text-indent:8px;color:#ffffff;">' +
    esc_(BRAND.name) +
    "</div>" +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:4px;text-indent:4px;text-transform:uppercase;color:#ffffff;opacity:0.7;padding-top:10px;">' +
    esc_(BRAND.tagline) +
    "</div>" +
    "</td></tr>"
  );
}

function emailFoot_() {
  const bits = [];
  if (BRAND.email) bits.push(esc_(BRAND.email));
  if (BRAND.phone) bits.push(esc_(BRAND.phone));
  if (BRAND.instagram) bits.push(esc_(BRAND.instagram));
  if (BRAND.website) {
    bits.push(
      '<a href="' +
        esc_(BRAND.website) +
        '" style="color:#ffffff;text-decoration:underline;">' +
        esc_(BRAND.website.replace(/^https?:\/\//, "")) +
        "</a>"
    );
  }

  return (
    '<tr><td align="center" style="background:' +
    COLOR.ink +
    ';padding:30px 24px;">' +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:17px;letter-spacing:6px;text-indent:6px;color:#ffffff;">' +
    esc_(BRAND.name) +
    "</div>" +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;opacity:0.6;padding-top:10px;">' +
    esc_(BRAND.tagline) +
    "</div>" +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#ffffff;opacity:0.6;padding-top:6px;">' +
    esc_(BRAND.city) +
    "</div>" +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#ffffff;opacity:0.55;padding-top:16px;line-height:1.7;">' +
    bits.join(" &nbsp;·&nbsp; ") +
    "</div>" +
    "</td></tr>" +
    "</table></td></tr></table></body></html>"
  );
}

function sectionLabel_(text) {
  return (
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:' +
    COLOR.muted +
    ';padding-bottom:10px;">' +
    esc_(text) +
    "</div>"
  );
}

function itemsTable_(items, total) {
  let rows = "";

  (items || []).forEach(function (item) {
    const variant = variantOf_(item);
    rows +=
      '<tr><td style="padding:14px 0;border-bottom:1px solid ' +
      COLOR.line +
      ';font-family:Arial,Helvetica,sans-serif;font-size:14px;color:' +
      COLOR.body +
      ';">' +
      esc_(item.name) +
      (variant
        ? '<div style="font-size:12px;color:' +
          COLOR.muted +
          ';padding-top:4px;">' +
          esc_(variant) +
          "</div>"
        : "") +
      '<div style="font-size:12px;color:' +
      COLOR.muted +
      ';padding-top:2px;">Qty ' +
      esc_(item.qty) +
      " × " +
      esc_(money_(item.price)) +
      "</div>" +
      '</td><td align="right" valign="top" style="padding:14px 0;border-bottom:1px solid ' +
      COLOR.line +
      ';font-family:Arial,Helvetica,sans-serif;font-size:14px;color:' +
      COLOR.body +
      ';white-space:nowrap;">' +
      esc_(money_(item.price * item.qty)) +
      "</td></tr>";
  });

  rows +=
    '<tr><td style="padding:16px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:' +
    COLOR.body +
    ';">Total</td>' +
    '<td align="right" style="padding:16px 0 0;font-family:Georgia,\'Times New Roman\',serif;font-size:19px;color:' +
    COLOR.body +
    ';white-space:nowrap;">' +
    esc_(money_(total)) +
    "</td></tr>";

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    rows +
    "</table>"
  );
}

function bankTable_(reference) {
  const row = function (label, value) {
    return (
      '<tr><td style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:' +
      COLOR.muted +
      ';width:44%;">' +
      esc_(label) +
      '</td><td style="padding:5px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:' +
      COLOR.body +
      ';">' +
      esc_(value) +
      "</td></tr>"
    );
  };

  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    row("Account name", BANK.accountName) +
    row("Bank", BANK.bankName) +
    row("Account number", BANK.accountNumber) +
    row("Branch code", BANK.branchCode) +
    row("Account type", BANK.accountType) +
    '<tr><td colspan="2" style="padding:12px 0 0;">' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:' +
    COLOR.muted +
    ';">Use this reference</div>' +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;letter-spacing:1px;color:' +
    COLOR.body +
    ';padding-top:4px;"><strong>' +
    esc_(reference) +
    "</strong></div>" +
    "</td></tr>" +
    "</table>"
  );
}

/* ------------------------------------------------------------------ *
 * Customer email
 * ------------------------------------------------------------------ */

function customerHtml_(data, orderId) {
  const firstName = String(data.firstName || data.name || "").split(" ")[0];

  return (
    emailHead_(BRAND.name + " — order " + orderId) +
    '<tr><td style="padding:38px 34px 10px;">' +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:24px;color:' +
    COLOR.body +
    ';">Thank you' +
    (firstName ? ", " + esc_(firstName) : "") +
    ".</div>" +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:' +
    COLOR.body +
    ';margin:16px 0 0;">' +
    "We have received your order and reserved your pieces. Your order will be confirmed as soon as we match your bank transfer to the reference below." +
    "</p>" +
    "</td></tr>" +
    // Order meta
    '<tr><td style="padding:26px 34px 0;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' +
    COLOR.ivory +
    ';">' +
    '<tr><td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:' +
    COLOR.muted +
    ';">Order number<div style="font-size:15px;color:' +
    COLOR.body +
    ';padding-top:4px;"><strong>' +
    esc_(orderId) +
    '</strong></div></td>' +
    '<td align="right" style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:' +
    COLOR.muted +
    ';">Date<div style="font-size:15px;color:' +
    COLOR.body +
    ';padding-top:4px;">' +
    esc_(today_()) +
    "</div></td></tr></table>" +
    "</td></tr>" +
    // Items
    '<tr><td style="padding:32px 34px 0;">' +
    sectionLabel_("Your order") +
    itemsTable_(data.items, data.total) +
    "</td></tr>" +
    // Payment
    '<tr><td style="padding:32px 34px 0;">' +
    sectionLabel_("Payment — bank transfer") +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid ' +
    COLOR.line +
    ';"><tr><td style="padding:18px;">' +
    bankTable_(data.reference) +
    "</td></tr></table>" +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.8;color:' +
    COLOR.muted +
    ';margin:12px 0 0;">' +
    "The reference must match the one on your deposit. It is how we find your payment. Cards are not accepted." +
    "</p>" +
    "</td></tr>" +
    // Delivery
    '<tr><td style="padding:32px 34px 0;">' +
    sectionLabel_("Delivery to") +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:' +
    COLOR.body +
    ';">' +
    esc_(data.name) +
    "<br>" +
    esc_(data.address) +
    "<br>" +
    esc_(data.city) +
    ", " +
    esc_(data.province) +
    " " +
    esc_(data.postal) +
    "<br>" +
    esc_(data.country || "South Africa") +
    "<br>" +
    esc_(data.phone) +
    "</div>" +
    "</td></tr>" +
    // Next steps
    '<tr><td style="padding:32px 34px 0;">' +
    sectionLabel_("What happens next") +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.9;color:' +
    COLOR.body +
    ';">' +
    "1. Transfer " +
    esc_(money_(data.total)) +
    " using the reference above.<br>" +
    "2. We match the payment and confirm your order by email.<br>" +
    "3. Your pieces are packed and sent, and we send you the tracking details." +
    "</div>" +
    "</td></tr>" +
    // Sign off
    '<tr><td style="padding:30px 34px 40px;">' +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:' +
    COLOR.body +
    ';margin:0;">' +
    "Any questions, simply reply to this email." +
    '<br><br>' +
    esc_(BRAND.signOff) +
    "</p>" +
    "</td></tr>" +
    emailFoot_()
  );
}

function customerText_(data, orderId) {
  const lines = (data.items || []).map(function (item) {
    return (
      "- " +
      item.qty +
      " x " +
      item.name +
      (variantOf_(item) ? " (" + variantOf_(item) + ")" : "") +
      " — " +
      money_(item.price * item.qty)
    );
  });

  return (
    BRAND.name +
    " — " +
    BRAND.tagline +
    "\n\n" +
    "Thank you for your order.\n\n" +
    "Order: " + orderId + "\n" +
    "Date: " + today_() + "\n\n" +
    "YOUR ORDER\n" + lines.join("\n") + "\n" +
    "Total: " + money_(data.total) + "\n\n" +
    "PAYMENT — BANK TRANSFER\n" +
    "Account name: " + BANK.accountName + "\n" +
    "Bank: " + BANK.bankName + "\n" +
    "Account number: " + BANK.accountNumber + "\n" +
    "Branch code: " + BANK.branchCode + "\n" +
    "Account type: " + BANK.accountType + "\n" +
    "Reference: " + data.reference + "\n\n" +
    "DELIVERY TO\n" +
    data.name + "\n" +
    data.address + "\n" +
    data.city + ", " + data.province + " " + data.postal + "\n" +
    (data.country || "South Africa") + "\n" +
    data.phone + "\n\n" +
    "We will confirm once the deposit matching this reference has been received.\n\n" +
    BRAND.signOff + "\n" +
    BRAND.email + "\n" +
    BRAND.city
  );
}

/* ------------------------------------------------------------------ *
 * Studio email
 * ------------------------------------------------------------------ */

function ownerHtml_(data, orderId) {
  const detail = function (label, value) {
    if (!value) return "";
    return (
      '<tr><td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:' +
      COLOR.muted +
      ';width:34%;">' +
      esc_(label) +
      '</td><td style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:' +
      COLOR.body +
      ';">' +
      esc_(value) +
      "</td></tr>"
    );
  };

  let sheetUrl = "";
  try {
    sheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  } catch (err) {
    sheetUrl = "";
  }

  return (
    emailHead_("New order " + orderId) +
    '<tr><td style="padding:34px 34px 0;">' +
    '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:22px;color:' +
    COLOR.body +
    ';">New order ' +
    esc_(orderId) +
    "</div>" +
    '<p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:' +
    COLOR.muted +
    ';margin:8px 0 0;">' +
    esc_(today_()) +
    " · Awaiting payment check</p>" +
    "</td></tr>" +
    '<tr><td style="padding:26px 34px 0;">' +
    sectionLabel_("Payment reference") +
    '<div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;color:' +
    COLOR.body +
    ";background:" +
    COLOR.ivory +
    ';padding:14px 18px;"><strong>' +
    esc_(data.reference) +
    "</strong> &nbsp;·&nbsp; " +
    esc_(money_(data.total)) +
    "</div>" +
    "</td></tr>" +
    '<tr><td style="padding:30px 34px 0;">' +
    sectionLabel_("Items") +
    itemsTable_(data.items, data.total) +
    "</td></tr>" +
    '<tr><td style="padding:30px 34px 0;">' +
    sectionLabel_("Customer") +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
    detail("Name", data.name) +
    detail("Email", data.email) +
    detail("Phone", data.phone) +
    detail("Address", data.address) +
    detail("City", data.city) +
    detail("Province", data.province) +
    detail("Postal code", data.postal) +
    detail("Country", data.country || "South Africa") +
    detail("Notes", data.notes) +
    "</table>" +
    "</td></tr>" +
    (sheetUrl
      ? '<tr><td style="padding:26px 34px 0;"><a href="' +
        esc_(sheetUrl) +
        '" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:' +
        COLOR.body +
        ';">Open the orders sheet →</a></td></tr>'
      : "") +
    '<tr><td style="padding:34px;"></td></tr>' +
    emailFoot_()
  );
}

function ownerText_(data, orderId) {
  const lines = (data.items || []).map(function (item) {
    return (
      "- " +
      item.qty +
      " x " +
      item.name +
      (variantOf_(item) ? " (" + variantOf_(item) + ")" : "") +
      " — " +
      money_(item.price * item.qty)
    );
  });

  return (
    "New order " + orderId + "\n" +
    today_() + " · Awaiting payment check\n\n" +
    "Reference: " + data.reference + "\n" +
    "Total: " + money_(data.total) + "\n\n" +
    "ITEMS\n" + lines.join("\n") + "\n\n" +
    "CUSTOMER\n" +
    data.name + "\n" +
    data.email + "\n" +
    data.phone + "\n\n" +
    "SHIP TO\n" +
    data.address + "\n" +
    data.city + ", " + data.province + " " + data.postal + "\n" +
    (data.country || "South Africa") + "\n" +
    (data.notes ? "\nNotes: " + data.notes + "\n" : "")
  );
}

/* ------------------------------------------------------------------ *
 * Web app
 * ------------------------------------------------------------------ */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const orderId = data.orderId || "FOUND-" + Date.now();

    const itemsText = (data.items || [])
      .map(function (item) {
        return (
          item.qty +
          " x " +
          item.name +
          (variantOf_(item) ? " (" + variantOf_(item) + ")" : "") +
          " @ " +
          money_(item.price)
        );
      })
      .join(" | ");

    getSheet_().appendRow([
      new Date(),
      orderId,
      data.name || "",
      data.email || "",
      data.phone || "",
      data.address || "",
      data.city || "",
      data.province || "",
      data.postal || "",
      data.country || "South Africa",
      itemsText,
      data.total || "",
      "Bank transfer / deposit",
      data.reference || "",
      "Awaiting payment check",
      data.notes || "",
    ]);

    const logo = logoBlob_();

    if (data.email) {
      const customerMail = {
        to: data.email,
        subject: BRAND.name + " — order " + orderId + " received",
        body: customerText_(data, orderId),
        htmlBody: customerHtml_(data, orderId),
        name: BRAND.senderName,
        replyTo: BRAND.email || OWNER_EMAIL,
      };
      if (logo) customerMail.inlineImages = { logo: logo };
      MailApp.sendEmail(customerMail);
    }

    const ownerMail = {
      to: OWNER_EMAIL,
      subject: "New order " + orderId + " — " + data.reference + " — " + money_(data.total),
      body: ownerText_(data, orderId),
      htmlBody: ownerHtml_(data, orderId),
      name: BRAND.senderName,
      replyTo: data.email || BRAND.email,
    };
    if (logo) ownerMail.inlineImages = { logo: logo };
    MailApp.sendEmail(ownerMail);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, orderId: orderId })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, service: "FOUND orders" })
  ).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ *
 * Run this once from the editor to send yourself a test of both emails
 * ------------------------------------------------------------------ */

function sendTestEmails() {
  const sample = {
    orderId: "FOUND-000123",
    name: "Thabo Mokoena",
    firstName: "Thabo",
    email: Session.getActiveUser().getEmail(),
    phone: "082 000 0000",
    address: "12 Bree Street",
    city: "Cape Town",
    province: "Western Cape",
    postal: "8001",
    country: "South Africa",
    notes: "Please deliver after 17:00.",
    reference: "Thabo_Mokoena",
    total: 1397,
    items: [
      { name: "The F. Essential Tee", color: "Black", size: "L", qty: 2, price: 549 },
      { name: "The F. Essential Cap", color: "Cream", size: "One size", qty: 1, price: 299 },
    ],
  };

  const logo = logoBlob_();

  const customerMail = {
    to: sample.email,
    subject: "[TEST] " + BRAND.name + " — order " + sample.orderId + " received",
    body: customerText_(sample, sample.orderId),
    htmlBody: customerHtml_(sample, sample.orderId),
    name: BRAND.senderName,
    replyTo: BRAND.email || OWNER_EMAIL,
  };
  if (logo) customerMail.inlineImages = { logo: logo };
  MailApp.sendEmail(customerMail);

  const ownerMail = {
    to: sample.email,
    subject: "[TEST] New order " + sample.orderId,
    body: ownerText_(sample, sample.orderId),
    htmlBody: ownerHtml_(sample, sample.orderId),
    name: BRAND.senderName,
  };
  if (logo) ownerMail.inlineImages = { logo: logo };
  MailApp.sendEmail(ownerMail);
}
