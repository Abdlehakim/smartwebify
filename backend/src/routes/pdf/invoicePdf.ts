/* ------------------------------------------------------------------
   src/routes/pdf/invoicePdf.ts
   Accepts either:
     - ORDER ref (e.g., ORDER-1234)
     - FACTURE ref (e.g., FC-1-2025)  ✅ keep as-is in header & filename
   Optional: ?doc=bl renders as delivery note style (filename BL-xxxx.pdf)
------------------------------------------------------------------ */
import { Router, type RequestHandler } from "express";
import puppeteer, { type Browser } from "puppeteer";
import { Types } from "mongoose";

import Order from "@/models/Order";
import Facture from "@/models/Facture";
import Client, { IClient } from "@/models/Client";
import CompanyData, { ICompanyData } from "@/models/websitedata/companyData";
import {
  renderInvoiceHtml,
  type OrderDoc,
  type PdfOptions,
  type PdfClient,
} from "@/templates/pdf/invoiceTemplate";

const router = Router();

/* ----------------------------- helpers ----------------------------- */

function acceptsPdf(req: any) {
  const a = String(req.get("accept") || "");
  return /application\/pdf/i.test(a);
}

async function toDataUrl(url: string): Promise<string | null> {
  try {
    if (!url) return null;
    if (/^data:/i.test(url)) return url;
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const mime = res.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function toOrderDoc(raw: any): OrderDoc {
  return {
    ref: String(raw?.ref ?? ""),
    DeliveryAddress: Array.isArray(raw?.DeliveryAddress) ? raw.DeliveryAddress : [],
    pickupMagasin: Array.isArray(raw?.pickupMagasin) ? raw.pickupMagasin : [],
    orderItems: Array.isArray(raw?.orderItems) ? raw.orderItems : [],
    deliveryMethod: Array.isArray(raw?.deliveryMethod) ? raw.deliveryMethod : undefined,
    paymentMethod: Array.isArray(raw?.paymentMethod) ? raw.paymentMethod : undefined,
    deliveryMethodLegacy: raw?.deliveryMethodLegacy ?? undefined,
    paymentMethodLegacy: raw?.paymentMethodLegacy ?? undefined,
    deliveryCostLegacy:
      typeof raw?.deliveryCostLegacy === "number" ? raw.deliveryCostLegacy : undefined,
    expectedDeliveryDate: raw?.expectedDeliveryDate ?? undefined,
    orderStatus: String(raw?.orderStatus ?? ""),
    createdAt: raw?.createdAt ?? new Date().toISOString(),
  };
}

function extractClientId(rawClient: any): string | null {
  if (!rawClient) return null;
  if (Types.ObjectId.isValid(rawClient) && String(rawClient) === String(new Types.ObjectId(rawClient))) {
    return String(rawClient);
  }
  if (rawClient?._id && Types.ObjectId.isValid(rawClient._id)) {
    return String(rawClient._id);
  }
  if (typeof rawClient === "string" && Types.ObjectId.isValid(rawClient)) {
    return rawClient;
  }
  return null;
}

async function buildClientFromOrder(rawOrder: any): Promise<PdfClient> {
  const deliveryAddr: string = rawOrder?.DeliveryAddress?.[0]?.DeliverToAddress || "";
  let block: PdfClient = {
    name: rawOrder?.clientName || "Client",
    address: deliveryAddr,
    vat: "",
    phone: "",
    email: "",
  };

  const clientId = extractClientId(rawOrder?.client);
  if (clientId) {
    try {
      const clientDoc = await Client.findById(clientId).lean<IClient | null>();
      if (clientDoc) {
        block = {
          ...block,
          name: block.name || clientDoc.username || clientDoc.email,
          phone: clientDoc.phone || block.phone || "",
          email: clientDoc.email || block.email || "",
        };
      }
    } catch (e) {
      console.warn("Client lookup failed:", e);
    }
  }
  return block;
}

/* --------------------- launch Chrome via Puppeteer image --------------------- */
async function launchBrowser(): Promise<Browser> {
  return puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=medium",
    ],
  });
}

/* ----------------------------- route ----------------------------- */

const getInvoicePdf: RequestHandler = async (req, res) => {
  const debug = req.query.debug === "1" || !acceptsPdf(req);
  // Optional support for BL (delivery note) — affects label & filename
  const docTypeParam = (req.query.doc === "bl" ? "bl" : "facture") as unknown as PdfOptions["docType"];

  let browser: Browser | null = null;

  try {
    const { ref: refParam } = req.params as { ref: string };
    const isFactureRef = /^FC-/i.test(refParam);

    // Resolved depending on ref type.
    let rawOrder: any | null = null;
    let displayRef = "";     // what we print in header & use for filename
    let dateForDoc: Date = new Date();
    let statusLabel: string | undefined; // "Annulée" if facture is cancelled

    if (isFactureRef) {
      // Fetch facture by ref (e.g., FC-1-2025)
      const fc = await Facture.findOne({ ref: refParam }).lean();
      if (!fc) {
        const payload = { error: "Facture not found", ref: refParam };
        if (debug) res.status(404).json(payload);
        else res.status(404).end();
        return;
      }

      // Resolve the order via orderRef (preferred), then fallback to order ObjectId
      if (fc.orderRef) {
        rawOrder = await Order.findOne({ ref: fc.orderRef }).lean();
      }
      if (!rawOrder && fc.order) {
        rawOrder = await Order.findById(fc.order).lean();
      }
      if (!rawOrder) {
        const payload = { error: "Order for facture not found", ref: refParam, orderRef: fc.orderRef };
        if (debug) res.status(404).json(payload);
        else res.status(404).end();
        return;
      }

      // Keep FC-… exactly for the printed number and the filename
      displayRef = String(fc.ref);
      dateForDoc = fc.issuedAt ? new Date(fc.issuedAt) : new Date(rawOrder.createdAt || Date.now());

      // Show badge "Annulée" when facture is cancelled
      if (fc.status === "Cancelled") statusLabel = "Annulée";
    } else {
      // Treat as Order ref (e.g., ORDER-xxxx)
      rawOrder = await Order.findOne({ ref: refParam }).lean();
      if (!rawOrder) {
        const payload = { error: "Order not found", ref: refParam };
        if (debug) res.status(404).json(payload);
        else res.status(404).end();
        return;
      }

      // For orders we keep previous behaviour: strip ORDER- in display
      displayRef = String(rawOrder.ref || "").replace(/^ORDER-/i, "");
      dateForDoc = new Date(rawOrder.createdAt || Date.now());
      // No status badge for orders
    }

    const order = toOrderDoc(rawOrder);
    const client: PdfClient = await buildClientFromOrder(rawOrder);

    const company = await CompanyData.findOne().lean<ICompanyData | null>();
    let logoSrc = company?.logoImageUrl || "";
    if (logoSrc) {
      const inline = await toDataUrl(logoSrc);
      if (inline) logoSrc = inline;
    }

    const opts: PdfOptions = {
      currency: "TND",
      docType: docTypeParam, // "facture" or "bl"
      number: displayRef,    // header shows FC-… for factures
      date: dateForDoc.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      pricesAreTTC: true,
      company: company
        ? {
            name: company.name,
            vat: company.vat,
            address: [company.address, company.city, company.zipcode, company.governorate]
              .filter(Boolean)
              .join(", "),
            phone: company.phone,
            email: company.email,
            logo: logoSrc,
          }
        : undefined,
      client,
      statusLabel,           // "Annulée" badge at top-left if set
    };

    let html: string, css: string;
    try {
      const out = renderInvoiceHtml(order, opts);
      html = out.html;
      css = out.css;
    } catch (e: any) {
      const payload = { error: "Template render failed", message: e?.message || String(e) };
      if (debug) res.status(500).json(payload);
      else res.status(500).end();
      return;
    }

    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${html}</body></html>`,
      { waitUntil: "networkidle0", timeout: 60_000 }
    );
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "10mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
    await page.close();

    if (debug) {
      res.status(200).json({
        ok: true,
        bytes: pdf.length,
        ref: refParam,
        note: "Remove ?debug=1 or set Accept: application/pdf to download the file.",
      });
      return;
    }

    const base = docTypeParam === "bl" ? "BL" : "FACTURE";
    const filename = `${base}-${displayRef || "document"}.pdf`;
    res
      .status(200)
      .setHeader("Content-Type", "application/pdf")
      .setHeader("Content-Disposition", `attachment; filename="${filename}"`)
      .setHeader("Cache-Control", "no-store, no-cache, must-revalidate")
      .setHeader("Pragma", "no-cache")
      .setHeader("Expires", "0")
      .setHeader("Content-Length", String(pdf.length))
      .end(pdf);
    return;
  } catch (err: any) {
    console.error("[invoicePdf] Failed:", err?.message || err);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: err?.message || String(err),
    });
    return;
  } finally {
    try {
      await browser?.close();
    } catch {}
  }
};

router.get("/invoice/:ref", getInvoicePdf);
export const invoicePdfRouter = router;
export default router;
