/* ----------------------------src/templates/pdf/invoiceTemplate.ts----------------------------- */

export type OrderItemAttr = {
  attribute: string;
  name: string;
  value: string;
};

export type OrderItem = {
  _id: string;
  reference: string;
  name: string;
  tva: number;          // % (e.g. 19)
  discount: number;     // % (e.g. 10)
  quantity: number;
  mainImageUrl?: string;
  price: number;        // HT or TTC depending on options.pricesAreTTC
  attributes?: OrderItemAttr[];
};

export type DeliveryMethodItem = {
  deliveryMethodID: string;
  deliveryMethodName?: string;
  Cost: string | number;
  expectedDeliveryDate?: string | Date;
};

export type PaymentMethodItem = {
  PaymentMethodID: string;
  PaymentMethodLabel: string;
};

export type PickupMagasinItem = {
  MagasinID: string;
  MagasinAddress: string;
  MagasinName?: string;
};

export interface OrderDoc {
  ref: string;
  DeliveryAddress: Array<{ DeliverToAddress: string }>;
  pickupMagasin: PickupMagasinItem[];
  orderItems: OrderItem[];
  deliveryMethod?: DeliveryMethodItem[];
  paymentMethod?: PaymentMethodItem[];
  deliveryMethodLegacy?: string;
  paymentMethodLegacy?: string;
  deliveryCostLegacy?: number;
  expectedDeliveryDate?: string | Date;
  orderStatus: string;
  createdAt: string | Date;
}

/* ----------------------------- PDF options ----------------------------- */

export type HiddenColumns = Partial<{
  ref: boolean;
  product: boolean;
  desc: boolean;
  qty: boolean;
  price: boolean;     // "Prix HT" column
  tva: boolean;
  discount: boolean;
  ttc: boolean;       // "Total TTC" column
}>;

export type PdfCompany = Partial<{
  name: string;
  vat: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
}>;

export type PdfClient = Partial<{
  name: string;
  vat: string;
  address: string;
  phone: string;
  email: string;
}>;

export type DocType = "facture" | "devis" | "bl" | "bc";

export interface PdfOptions {
  company?: PdfCompany;
  client?: PdfClient;         // if omitted, we’ll use delivery address only
  currency?: string;          // default "TND"
  docType?: DocType;          // default "facture"
  number?: string;            // default from order.ref
  date?: string;              // default from order.createdAt (fr-FR)
  notes?: string;
  hiddenColumns?: HiddenColumns;
  pricesAreTTC?: boolean;     // if true, price in items is TTC and we convert to HT; default true
  /** If set, renders a badge at top-left (e.g., "Annulée") */
  statusLabel?: string;
}

/* ------------------------------ Utilities ------------------------------ */

const esc = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v) || 0);

const CURRENCY_WORDS: Record<
  string,
  { major: string; minor: string; minorFactor: number }
> = {
  TND: { major: "dinars", minor: "millimes", minorFactor: 1000 },
  EUR: { major: "euros", minor: "centimes", minorFactor: 100 },
  USD: { major: "dollars", minor: "cents", minorFactor: 100 },
};

const pRow = (label: string, value?: string, style = "") => {
  const v = (value ?? "").toString().trim();
  // Treat placeholders as empty so they don't render gaps
  if (!v || v === "—" || v === "-") return "";
  return `<p class="pdf-small" style="${style}">
           <em style="font-weight:600">${label}&nbsp;:</em> ${esc(v)}
         </p>`;
};

const fmtMoney = (v: number, c = "TND") => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: c }).format(v);
  } catch {
    return (
      new Intl.NumberFormat(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v) + " " + c
    );
  }
};

const companyInline = (c: PdfCompany) =>
  [c.name, c.vat, c.address, c.phone, c.email]
    .map(x => (x ?? "").toString().trim())
    .filter(Boolean)
    .join(", ");

const wordsFR = (n0: number): string => {
  const UNITS = [
    "zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf",
    "dix","onze","douze","treize","quatorze","quinze","seize",
  ];
  const TENS = ["","dix","vingt","trente","quarante","cinquante","soixante"];
  const two = (x: number): string => {
    if (x < 17) return UNITS[x];
    if (x < 20) return "dix-" + UNITS[x - 10];
    if (x < 70) {
      const t = Math.floor(x / 10), u = x % 10;
      if (u === 1 && t !== 8) return TENS[t] + " et un";
      return TENS[t] + (u ? "-" + UNITS[u] : "");
    }
    if (x < 80) return "soixante-" + two(x - 60);
    const u = x - 80;
    if (u === 0) return "quatre-vingts";
    return "quatre-vingt-" + two(u);
  };
  const hundred = (h: number, tail: string) => {
    if (h === 0) return tail;
    if (h === 1) return "cent" + (tail ? " " + tail : "");
    return (UNITS[h] + " cent" + (tail ? " " + tail : "s")).trim();
  };
  const three = (x: number) => {
    const h = Math.floor(x / 100), r = x % 100;
    const tail = r ? two(r) : "";
    if (h >= 2 && r === 0) return UNITS[h] + " cents";
    return hundred(h, tail);
  };
  const chunk = (x: number, sing: string, plur: string) => {
    if (x === 0) return "";
    if (sing === "mille") return x === 1 ? "mille" : two(x) + " mille";
    return x === 1 ? "un " + sing : two(x) + " " + plur;
  };
  let n = Math.floor(Math.abs(n0));
  if (n === 0) return UNITS[0];
  let s = "";
  const g = Math.floor(n / 1e9); n %= 1e9;
  const m = Math.floor(n / 1e6); n %= 1e6;
  const k = Math.floor(n / 1e3); n %= 1e3;
  if (g) s += chunk(g, "milliard", "milliards") + " ";
  if (m) s += chunk(m, "million", "millions") + " ";
  if (k) s += chunk(k, "mille", "mille") + " ";
  s += three(n).trim();
  return s.replace(/\s+/g, " ").trim();
};

const amountInWords = (amount: number, currencyCode = "TND") => {
  const cfg = CURRENCY_WORDS[currencyCode] || CURRENCY_WORDS.EUR;
  const rounded =
    Math.round((amount + 1e-9) * cfg.minorFactor) / cfg.minorFactor;
  let major = Math.floor(rounded + 1e-9);
  let minor = Math.round((rounded - major) * cfg.minorFactor);
  if (minor === cfg.minorFactor) { major += 1; minor = 0; }
  const majorPart = `${wordsFR(major)} ${cfg.major}`;
  const minorPart = minor ? ` et ${wordsFR(minor)} ${cfg.minor}` : "";
  return (majorPart + minorPart).replace(/^./, (c) => c.toUpperCase());
};

const fmtDateFR = (val?: string | Date): string => {
  if (!val) return "";
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR");
};

/** Delivery text: names only (no cost/date) */
const formatDelivery = (order: OrderDoc): string => {
  const dm = Array.isArray(order.deliveryMethod) ? order.deliveryMethod : [];
  if (dm.length > 0) {
    const parts = dm
      .map(d => (d?.deliveryMethodName || "").toString())
      .filter(Boolean);
    return parts.join(" • ");
  }
  return order.deliveryMethodLegacy || "";
};

/** Delivery cost used for mini-summary */
const getDeliveryCost = (order: OrderDoc): number => {
  const dm = Array.isArray(order.deliveryMethod) ? order.deliveryMethod : [];
  const fromArray = dm.reduce((sum, d) => sum + toNum(d.Cost), 0);
  const legacy = typeof order.deliveryCostLegacy === "number" ? order.deliveryCostLegacy : 0;
  return legacy || fromArray;
};

/* ------------------------------- Styling ------------------------------- */

const PDF_CSS = `
:root{
  --invoice-font: -apple-system, BlinkMacSystemFont, "Segoe UI",
                  Arial, "Helvetica Neue", Helvetica, "Liberation Sans", Roboto, "Noto Sans", sans-serif;
}
body.printing, body.print-mode { background:#ffffff !important; }
body.printing .app, body.print-mode .app { display:none !important; }
body.printing #pdfRoot,
body.print-mode #pdfRoot {
  display:block !important;
  position:fixed;
  background:#ffffff;
}
.pdf-page{
  position:relative;
  width:210mm; min-height:297mm;
  background:#ffffff; color:#000000;
  padding:16mm 14mm;
  box-sizing:border-box;
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  font-family: var(--invoice-font);
  font-variant-numeric: tabular-nums;
  letter-spacing:0.02em;
}
.pdf-head{display:flex;justify-content:space-between;align-items:center}
.pdf-title{font-size:18px;font-weight:700;margin:0;color:#111827; font-family: var(--invoice-font);}
.pdf-logo-wrap{width:298px;height:40px;display:flex;align-items:center;justify-content:flex-end}
.pdf-logo{max-width:100%;max-height:100%;object-fit:contain;display:block}
.pdf-divider{height:2px; background:#15335e;margin:12px 0 16px}
.title-divider{height:1px; background:#15335e;margin:0px 0px 8px; width:200px}
.title-divider-bot {height:1px; background:#15335e; margin:8px 0px; width:200px}
.pdf-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px;font-size:14px}
.pdf-small{ 
  font-size:12px; 
  line-height:1.05;
}
.pdf-bottom{font-size:10px}

/* Status badge (top-left) */
.pdf-status-badge{
  position:absolute;
  top:6mm;
  left:8mm;
  z-index:5;
  padding:6px 10px;
  border:2px solid #b91c1c;
  color:#b91c1c;
  background:rgba(254,226,226,.92);
  font-weight:700;
  font-size:12px;
  border-radius:6px;
  letter-spacing:.04em;
  text-transform:uppercase;
}

/* Tight vertical stack with no margin-collapsing or gaps */
.stack{
  display:flex;
  flex-direction:column;
  gap:3px;
  margin:0;
  padding:0;
  line-height:0;   /* kill whitespace text-node height */
  font-size:0;     /* kill whitespace text-node size */
}
.stack > *{
  margin:0;
  padding:0;
  line-height:1.05;  /* actual line height for children */
  font-size:12px;    /* actual font size for children */
}
.stack .client-name{
  font-weight:600;
  font-size:14px;
  line-height:1.05;
}
/* Safety net: if an empty element slips in, hide it */
.stack > *:empty { display:none !important; }

.pdf-meta{background:#f9fafb;padding:12px;border-radius:5px;margin-top:12px; width:280px}
.pdf-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:12px}
.tableDiv{ margin-top:20px; border-radius:5px; border:2px solid #15335e; overflow-x:auto; height:500px }
.pdf-table{ width:100%; font-size:10px; table-layout:auto; font-family: var(--invoice-font); }
.pdf-table th,.pdf-table td{ padding:8px; vertical-align:top }
.pdf-table thead th{ font-weight:600; background-color:#15335e; color:#fff; text-align:right; }
.pdf-table thead th:nth-child(1),
.pdf-table thead th:nth-child(2),
.pdf-table thead th:nth-child(3),
.pdf-table tbody td:nth-child(1),
.pdf-table tbody td:nth-child(2),
.pdf-table tbody td:nth-child(3){ text-align:left; }
.pdf-table tbody tr td { border-bottom: 1px solid #15335e; }
.pdf-table tbody tr:last-child td { border-bottom: 0; }
.pdf-mini-sum{
  border:2px solid #15335e;
  min-width:200px;
  max-width:280px;
  margin-left:auto;
  border-radius:5px;
  margin-top:16px;
}
.pdf-mini-table{ width:100%}
.pdf-mini-table th,
.pdf-mini-table td{
  background:#fff;
  color:#0e1220;
  font-size:8px; font-weight:600;
  text-align:center;
  padding:8px;
  font-family: var(--invoice-font);
}
.pdf-mini-table .head th{ background:#15335e; color:#fff; }
.pdf-mini-table .grand th{ background:#15335e; font-size:10px; font-weight:600; color:#fff; }
.pdf-mini-table .right{ text-align:center; }

.pdf-company-footer{
  position:absolute;
  left:15mm;
  bottom:5mm;
  max-width:40%;
  font-size:12px;
  line-height:1.25;
}
.pdf-company-footer p{ margin:0; }
.pdf-company-footer .name{
  font-weight:700;
  text-transform:uppercase;
  margin-bottom:2px;
}

.pdf-sign{position:absolute;bottom:5mm;right:20mm;text-align:left;font-size:12px}
.pdf-sign-line{font-size:8px;margin:0px;border-top:1px solid #000;width:200px}

@page { size:A4; margin:0; }
.pdf-amount-words{
  position: absolute;
  display: flex;
  flex-direction: column;
  left: 15mm;
  top: 240mm;
  max-width: 45%;
  font-size: 12px;
  line-height: 1.25;
  font-weight: 500;
}
.section-box {
  border: 1px solid #15335e;
  border-radius: 5px;
  padding: 14px 16px 16px;
  background: #fff;
  margin: 0;
}
.section-box > legend {
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 0 8px;
  margin-left: 8px;
}
.pdf-notes{
  margin-top:10px;
  font-size:10px;
  line-height:1.25;
  font-weight:500;
  white-space: pre-wrap;
  word-break: break-word;
}
.pdf-notes-title{
  font-weight: 400;
  letter-spacing: .02em;
}
`;

/* ------------------------------- Builder ------------------------------- */

type Row = {
  ref: string;
  product: string;
  desc: string;
  qty: number;
  priceHT: number;    // prix HT
  tva: number;        // %
  discount: number;   // %
  totalTTC: number;   // line total TTC
};

function computeRow(it: OrderItem, pricesAreTTC: boolean): Row {
  const qty = toNum(it.quantity);
  const tva = toNum(it.tva);
  const discount = toNum(it.discount);
  const priceInput = toNum(it.price);

  const priceHT = pricesAreTTC ? priceInput / (1 + tva / 100) : priceInput;
  const baseHT = qty * priceHT;
  const discHT = baseHT * (discount / 100);
  const afterHT = baseHT - discHT;
  const tvaAmt = afterHT * (tva / 100);
  const totalTTC = afterHT + tvaAmt;

  const desc =
    Array.isArray(it.attributes) && it.attributes.length
      ? it.attributes.map(a => `${a.name}: ${a.value}`).join(" • ")
      : "";

  return {
    ref: it.reference || "",
    product: it.name || "",
    desc,
    qty,
    priceHT,
    tva,
    discount,
    totalTTC,
  };
}

/* -------------------------------- Render ------------------------------- */

export function renderInvoiceHtml(
  order: OrderDoc,
  options: PdfOptions = {}
): { html: string; css: string } {
  const cur = options.currency || "TND";
  const docType: DocType = options.docType || "facture";
  const number = options.number || String(order.ref || "").replace(/^ORDER-/, "");
  const dateStr =
    options.date ||
    new Date(order.createdAt as any).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  // Default company fields to empty strings so absent fields truly vanish
  const company: PdfCompany = {
    name: options.company?.name || "",
    vat: options.company?.vat || "",
    address: options.company?.address || "",
    phone: options.company?.phone || "",
    email: options.company?.email || "",
    logo: options.company?.logo || "",
  };

  // Build a simple client block from options or order delivery
  const client: PdfClient = {
    name: options.client?.name || "Client",
    vat: options.client?.vat || "",
    address:
      options.client?.address ||
      (order.DeliveryAddress?.[0]?.DeliverToAddress
        ? order.DeliveryAddress[0].DeliverToAddress
        : ""),
    phone: options.client?.phone || "",
    email: options.client?.email || "",
  };

  // Build stacks with only present fields → no gaps
  const companyStackHtml = [
    company.name && `<p class="client-name" style="text-transform:uppercase">${esc(company.name)}</p>`,
    company.vat && pRow("MF", company.vat),
    company.address && pRow("Adresse", company.address, "text-transform:capitalize"),
    company.phone && pRow("Téléphone", company.phone),
    company.email && pRow("Email", company.email),
  ].filter(Boolean).join("");

  const clientStackHtml = [
    (client.name || "Client") && `<p class="client-name">${esc(client.name || "Client")}</p>`,
    client.vat && pRow("MF", client.vat),
    client.address && pRow("Adresse", client.address, "text-transform:capitalize; white-space:pre-line"),
    client.phone && pRow("Téléphone", client.phone),
    client.email && pRow("Email", client.email),
  ].filter(Boolean).join("");

  const hidden: HiddenColumns = {
    ref: options.hiddenColumns?.ref || false,
    product: options.hiddenColumns?.product || false,
    desc: options.hiddenColumns?.desc || false,
    qty: options.hiddenColumns?.qty || false,
    price: options.hiddenColumns?.price || false,
    tva: options.hiddenColumns?.tva || false,
    discount: options.hiddenColumns?.discount || false,
    ttc: options.hiddenColumns?.ttc || false,
  };

  const pricesAreTTC = options.pricesAreTTC ?? true;

  // Build rows & totals
  const rows = order.orderItems.map((it) => computeRow(it, pricesAreTTC));
  const totalAfterDiscountHT = rows.reduce(
    (s, r) => s + (r.qty * r.priceHT) * (1 - r.discount / 100),
    0
  );
  const totalTVA = rows.reduce(
    (s, r) => s + (r.qty * r.priceHT) * (1 - r.discount / 100) * (r.tva / 100),
    0
  );
  const totalTTC = totalAfterDiscountHT + totalTVA; // Shipping NOT included in grand total by design
  const deliveryCost = getDeliveryCost(order);

  const typeMap: Record<
    DocType,
    { DOC_LABEL: string; NUM_LABEL: string; SHOW_WORDS: boolean }
  > = {
    facture: { DOC_LABEL: "Facture",          NUM_LABEL: "N° de facture",          SHOW_WORDS: true  },
    devis:   { DOC_LABEL: "Devis",            NUM_LABEL: "N° de devis",            SHOW_WORDS: true  },
    bl:      { DOC_LABEL: "Bon de livraison", NUM_LABEL: "N° de bon de livraison", SHOW_WORDS: false },
    bc:      { DOC_LABEL: "Bon de commande",  NUM_LABEL: "N° de bon de commande",  SHOW_WORDS: false },
  };
  const { DOC_LABEL, NUM_LABEL, SHOW_WORDS } = typeMap[docType];

  const wordsHeader =
    docType === "devis"
      ? "Arrêté le présent devis à la somme de&nbsp;:"
      : docType === "facture"
      ? "Arrêté la présente facture à la somme de&nbsp;:"
      : "";

  // Decide which headers to render (respect hidden columns)
  const headers: string[] = [];
  if (!hidden.ref) headers.push("Réf.");
  if (!hidden.product) headers.push("Produit");
  if (!hidden.desc) headers.push("Description");
  if (!hidden.qty) headers.push("Qté");
  if (!hidden.price) headers.push("Prix HT");
  if (!hidden.tva) headers.push("TVA %");
  if (!hidden.discount) headers.push("Remise %");
  const hideTTC = hidden.ttc || hidden.price; // if Prix HT is hidden, hide Total TTC too
  if (!hideTTC) headers.push("Total TTC");

  const rowsHTML = rows
    .map((r) => {
      const cells: string[] = [];
      if (!hidden.ref) cells.push(`<td>${esc(r.ref)}</td>`);
      if (!hidden.product) cells.push(`<td>${esc(r.product)}</td>`);
      if (!hidden.desc) cells.push(`<td>${esc(r.desc)}</td>`);
      if (!hidden.qty) cells.push(`<td style="text-align:right">${r.qty}</td>`);
      if (!hidden.price) cells.push(`<td style="text-align:right">${fmtMoney(r.priceHT, cur)}</td>`);
      if (!hidden.tva) cells.push(`<td style="text-align:right">${r.tva}%</td>`);
      if (!hidden.discount) cells.push(`<td style="text-align:right">${r.discount > 0 ? r.discount + "%" : "0"}</td>`);
      if (!hideTTC) cells.push(`<td style="text-align:right">${fmtMoney(r.totalTTC, cur)}</td>`);
      return `<tr class="pdf-row">${cells.join("")}</tr>`;
    })
    .join("");

  const wordsTTC = SHOW_WORDS ? amountInWords(totalTTC, cur) : "";

  const notesHTML =
    options.notes && options.notes.trim()
      ? `<div class="pdf-notes">
           <div class="pdf-notes-title"><span style="font-weight:600">Notes&nbsp;:</span>${esc(options.notes).replace(/\n/g, "<br/>")}</div>
         </div>`
      : "";

  const amountWordsBlock =
    (SHOW_WORDS || notesHTML)
      ? `<div class="pdf-amount-words">
           ${SHOW_WORDS ? `${wordsHeader}<br/><strong>${esc(wordsTTC)}</strong>` : ""}
           ${notesHTML}
         </div>`
      : "";

  const miniSumHTML = hideTTC
    ? ""
    : `
      <div class="pdf-mini-sum">
        <table class="pdf-mini-table">
          <tbody>
            <tr class="head">
              <th>Total HT</th>
              <th class="right">${fmtMoney(totalAfterDiscountHT, cur)}</th>
            </tr>
            <tr>
              <td>TVA</td>
              <td class="right">${fmtMoney(totalTVA, cur)}</td>
            </tr>
            ${deliveryCost > 0 ? `
            <tr>
              <td>Coût de livraison</td>
              <td class="right">${fmtMoney(deliveryCost, cur)}</td>
            </tr>` : ``}
            <tr class="grand">
              <th>Total TTC</th>
              <th class="right">${fmtMoney(totalTTC, cur)}</th>
            </tr>
          </tbody>
        </table>
      </div>`;

  // Delivery method text for the meta block (names only)
  const deliveryText = formatDelivery(order);

  // Bottom-left company footer (render only if non-empty)
  const footerLine = companyInline(company);
  const companyFooterHtml = footerLine
    ? `<div class="pdf-company-footer">
         <p class="pdf-bottom" style="text-transform:capitalize">
           ${esc(footerLine)}
         </p>
       </div>`
    : "";

  // Optional status badge
  const statusBadgeHtml = options.statusLabel
    ? `<div class="pdf-status-badge">${esc(options.statusLabel)}</div>`
    : "";

  const html = `
<div class="pdf-page">
  ${statusBadgeHtml}
  <div class="pdf-head">
    <h1 class="pdf-title">${DOC_LABEL} N° : <span style="font-weight:600">${esc(number || "—")}</span></h1>
    <div class="pdf-logo-wrap">
      ${company.logo
        ? `<img src="${esc(company.logo)}" class="pdf-logo" alt="Logo" referrerpolicy="no-referrer" />`
        : ""}
    </div>
  </div>

  <div class="pdf-divider"></div>

  <div class="pdf-grid-2">
    <div>
      <div class="stack">${companyStackHtml}</div>

      <div class="pdf-meta">
        <div class="pdf-meta-grid">
          <span>Date&nbsp;:</span><span style="font-weight:600">${esc(dateStr)}</span>
          <span>${NUM_LABEL}&nbsp;:</span><span style="font-weight:600">${esc(number || "—")}</span>
          <span>Devise&nbsp;:</span><span style="font-weight:600">${esc(cur)}</span>
          ${deliveryText ? `<span>Méthode de livraison&nbsp;:</span><span style="font-weight:600">${esc(deliveryText)}</span>` : ""}
        </div>
      </div>
    </div>

    <fieldset class="section-box">
      <legend style="margin:0;font-weight:700">CLIENT</legend>
      <div class="stack">${clientStackHtml}</div>
    </fieldset>
  </div>

  <div class="tableDiv">
    <table class="pdf-table">
      <thead>
        <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
      </thead>
      <tbody>${rowsHTML}</tbody>
    </table>
  </div>

  ${miniSumHTML}
  ${amountWordsBlock}

  ${companyFooterHtml}

  <div class="pdf-sign">
    <p class="pdf-sign-line">Signature et cachet Fait le : ${esc(dateStr)}</p>
    <p style="margin:0px;font-style:italic;font-size:12px">Merci pour votre confiance&nbsp;!</p>
  </div>
</div>`;

  return { html, css: PDF_CSS };
}
