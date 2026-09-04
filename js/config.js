/* FOUND. — order settings
   After you deploy the Google Apps Script, paste the Web App URL below.
*/
window.FOUND_CONFIG = {
  orderWebhook:
    "https://script.google.com/macros/s/AKfycbzcR9n1AiMgieW2XX-4tU_o-imtq42qBc5OHr8GKzj97UCW0J7H0NqtNpG0EATtNGks/exec",
  ownerEmail: "orders@foundthreads.co.za",
  brandName: "FOUND.",

  /* Delivery via PostNet2PostNet (published rates).
     R99  = prepaid flyer, 0–2kg
     R109 = standard, first 5kg, then R25/kg
     A tee + cap is well under 2kg, so R109 covers a full order.
     freeOver applies only to freeOverProvinces. */
  delivery: {
    flatRate: 109,
    freeOver: 1500,
    freeOverProvinces: ["Western Cape"],
    provinceRates: {
      "Western Cape": 99,
      "Eastern Cape": 109,
      "Northern Cape": 109,
      "Free State": 109,
      Gauteng: 109,
      "KwaZulu-Natal": 109,
      "North West": 109,
      Mpumalanga: 109,
      Limpopo: 109,
    },
    note: "Sent via PostNet, 2–3 working days after payment is confirmed. Free delivery in the Western Cape on orders of R1500 or more.",
  },
  bank: {
    accountName: "MR PROSPER T SIGAMFELA",
    bankName: "Capitec",
    accountNumber: "2504570844",
    branchCode: "470010",
    accountType: "Savings",
  },
};
