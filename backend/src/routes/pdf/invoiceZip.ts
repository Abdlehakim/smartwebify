/* ------------------------------------------------------------------
   src/routes/pdf/invoiceZip.ts
   Streams a ZIP file containing multiple facture PDFs, with SSE progress.

   Endpoints (mounted e.g. at /api/zip):

     - GET  /invoices/zip?month=YYYY-MM[&status=Paid|Cancelled][&doc=facture|bl][&progressId=...]
     - GET  /invoices/zip?from=YYYY-MM-DD&to=YYYY-MM-DD[&status=...][&doc=...][&progressId=...]
     - POST /invoices/zip
           {
             "refs": ["FC-1-2025","FC-2-2025"],
             "doc": "facture" | "bl",
             "progressId": "optional-id"
           }

     - GET  /invoices/progress/:id  (SSE live progress with heartbeat)
------------------------------------------------------------------ */

import { Router, type RequestHandler, type Response } from "express";
import puppeteer, { type Browser, type Page } from "puppeteer";
import archiver from "archiver";
import { Types } from "mongoose";
import os from "node:os";

import Facture from "@/models/Facture";
import Order from "@/models/Order";
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

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  if (typeof rawClient === "string" && Types.ObjectId.isValid(rawClient)) return rawClient;
  if (rawClient?._id && Types.ObjectId.isValid(rawClient._id)) return String(rawClient._id);
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

/** Resolve the Order doc for a given facture (by orderRef or order ObjectId). */
async function findOrderForFacture(fc: any) {
  let rawOrder: any | null = null;

  if (fc.orderRef) {
    rawOrder = await Order.findOne({ ref: fc.orderRef }).lean();
    if (!rawOrder && /^ORDER-/i.test(fc.orderRef)) {
      const bare = String(fc.orderRef).replace(/^ORDER-/i, "");
      rawOrder = await Order.findOne({
        ref: { $regex: `^ORDER-${escapeRegExp(bare)}$`, $options: "i" },
      }).lean();
    }
  }
  if (!rawOrder && fc.order && Types.ObjectId.isValid(fc.order)) {
    rawOrder = await Order.findById(fc.order).lean();
  }
  return rawOrder;
}

/** Render a single facture PDF and return { filename, buffer } */
async function renderFacturePdfBuffer(
  fcRef: string,
  browser: Browser,
  docType: PdfOptions["docType"],
): Promise<{ filename: string; buffer: Buffer }> {
  const fc = await Facture.findOne({
    ref: { $regex: `^${escapeRegExp(fcRef)}$`, $options: "i" },
  }).lean();
  if (!fc) throw new Error(`Facture not found: ${fcRef}`);

  const rawOrder = await findOrderForFacture(fc);
  if (!rawOrder) {
    throw new Error(`Order not found for facture ${fcRef} (orderRef=${fc.orderRef ?? "—"})`);
  }

  const order = toOrderDoc(rawOrder);
  const client: PdfClient = await buildClientFromOrder(rawOrder);

  const company = await CompanyData.findOne().lean<ICompanyData | null>();
  let logoSrc = company?.logoImageUrl || "";
  if (logoSrc) {
    const inline = await toDataUrl(logoSrc);
    if (inline) logoSrc = inline;
  }

  const displayRef = String(fc.ref);
  const dateForDoc = fc.issuedAt ? new Date(fc.issuedAt) : new Date(rawOrder.createdAt || Date.now());
  const statusLabel = fc.status === "Cancelled" ? "Annulée" : undefined;

  const opts: PdfOptions = {
    currency: "TND",
    docType,
    number: displayRef,
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
    statusLabel,
  };

  const out = renderInvoiceHtml(order, opts);

  // Create a NEW page per facture to allow parallelism safely
  const page: Page = await browser.newPage();
  try {
    await page.setJavaScriptEnabled(false); // faster if template is static
    // Don't stall on external fonts/images — render when DOM is ready
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8"><style>${out.css}</style></head><body>${out.html}</body></html>`,
      { waitUntil: "domcontentloaded", timeout: 15_000 },
    );

    const pdfUA = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "10mm", right: "10mm", bottom: "12mm", left: "10mm" },
    });
    const buffer = Buffer.from(pdfUA as Uint8Array);

    const base = docType === "bl" ? "BL" : "FACTURE";
    const filename = `${base}-${displayRef}.pdf`;
    return { filename, buffer };
  } finally {
    try {
      await page.close();
    } catch {}
  }
}

/** Build a list of facture refs based on query/body filters. */
async function selectFactureRefs(req: any): Promise<string[]> {
  // 1) explicit POST body { refs: [...] }
  if (req.method === "POST" && Array.isArray(req.body?.refs) && req.body.refs.length) {
    return req.body.refs.map((r: any) => String(r));
  }

  // 2) GET ?month=YYYY-MM or ?from=...&to=...
  const month = String(req.query.month || "");
  const from = String(req.query.from || "");
  const to = String(req.query.to || "");
  const statusQ = String(req.query.status || ""); // "Paid" or "Paid,Cancelled"
  const statuses = statusQ
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const match: any = {};
  if (statuses.length) match.status = { $in: statuses };

  let start: Date | null = null;
  let end: Date | null = null;

  if (month) {
    const [y, m] = month.split("-").map((n) => parseInt(n, 10));
    if (y && m) {
      start = new Date(y, m - 1, 1, 0, 0, 0, 0);
      end = new Date(y, m, 0, 23, 59, 59, 999);
    }
  } else if (from && to) {
    const s = new Date(from);
    const e = new Date(to);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      start = s;
      end = e;
    }
  }

  if (start && end) {
    match.$or = [
      { issuedAt: { $gte: start, $lte: end } },
      { issuedAt: { $exists: false }, createdAt: { $gte: start, $lte: end } },
    ];
  }

  const factures = await Facture.find(match)
    .select("ref issuedAt createdAt")
    .sort({ issuedAt: 1, createdAt: 1 })
    .lean();

  return factures.map((f: any) => String(f.ref)).filter(Boolean);
}

/* ------------------------- SSE progress support ------------------------- */

type ZipProgress = {
  done: number;
  total: number;
  failed: number;
  status: "running" | "done" | "error";
  message?: string;
};

const progressStore = new Map<string, ZipProgress>();
const progressSubs = new Map<string, Set<Response>>(); // job id -> set of SSE responses

function broadcastProgress(id: string) {
  const data = progressStore.get(id);
  if (!data) return;
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  const subs = progressSubs.get(id);
  if (!subs) return;
  for (const res of subs) {
    try {
      res.write(payload);
    } catch {
      // broken pipe; ignore
    }
  }
}

function setProgress(id: string, patch: Partial<ZipProgress>) {
  const curr = progressStore.get(id) ?? { done: 0, total: 0, failed: 0, status: "running" as const };
  const next: ZipProgress = { ...curr, ...patch };
  progressStore.set(id, next);
  broadcastProgress(id);
}

/* ----------------------------- routes ----------------------------- */

/** SSE with heartbeat: GET /invoices/progress/:id */
router.get("/invoices/progress/:id", (req, res) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  (res as any).flushHeaders?.();

  const set = progressSubs.get(id) ?? new Set<Response>();
  set.add(res);
  progressSubs.set(id, set);

  // first snapshot
  const snap = progressStore.get(id) ?? { done: 0, total: 0, failed: 0, status: "running" as const };
  res.write(`data: ${JSON.stringify(snap)}\n\n`);

  // heartbeat
  const hb = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 5000);

  req.on("close", () => {
    clearInterval(hb);
    const s = progressSubs.get(id);
    s?.delete(res);
  });
});

/** ZIP: GET/POST /invoices/zip */
const zipInvoices: RequestHandler = async (req, res) => {
  const docType = (req.query.doc === "bl" ? "bl" : "facture") as PdfOptions["docType"];

  // Build list of refs
  const refs = await selectFactureRefs(req);
  if (!refs.length) {
    return res.status(404).json({ error: "No factures match the selection." });
  }

  // Initialize progress (if client provided an id)
  const progressId = typeof req.query.progressId === "string"
    ? req.query.progressId
    : (typeof req.body?.progressId === "string" ? req.body.progressId : "");
  if (progressId) {
    setProgress(progressId, { done: 0, total: refs.length, failed: 0, status: "running" });
  }

  // Filename
  const month = String(req.query.month || "");
  const filename = month
    ? `FACTURES-${month}.zip`
    : `FACTURES-${new Date().toISOString().slice(0, 10)}.zip`;

  res.status(200);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.on("warning", (err: unknown) => {
    console.warn("[invoiceZip] warning:", err);
  });
  archive.on("error", (err: unknown) => {
    console.error("[invoiceZip] error:", err);
    try { res.status(500).end(); } catch {}
  });

  // Pipe the archive to the response
  archive.pipe(res);

  const failed: string[] = [];
  let browser: Browser | null = null;

  // limit parallel page renders (moderate to avoid memory spikes)
  const cpu = Math.max(1, os.cpus()?.length || 1);
  const CONCURRENCY = Math.min(3, Math.max(1, cpu - 1));

  // simple pool runner
  async function runLimited<T>(
    items: T[],
    limit: number,
    worker: (item: T) => Promise<void>,
  ): Promise<void> {
    let idx = 0;
    const runners = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
      while (true) {
        const myIdx = idx++;
        if (myIdx >= items.length) break;
        await worker(items[myIdx]);
      }
    });
    await Promise.all(runners);
  }

  try {
    browser = await launchBrowser();

    await runLimited(refs, CONCURRENCY, async (ref) => {
      try {
        const { filename: file, buffer } = await renderFacturePdfBuffer(ref, browser!, docType);
        archive.append(buffer, { name: file });
      } catch (e: any) {
        failed.push(`${ref}: ${e?.message || String(e)}`);
        if (progressId) {
          const curr = progressStore.get(progressId);
          setProgress(progressId, { failed: (curr?.failed ?? 0) + 1 });
        }
      } finally {
        if (progressId) {
          const curr = progressStore.get(progressId);
          setProgress(progressId, { done: (curr?.done ?? 0) + 1 });
        }
      }
    });

    if (failed.length) {
      const errorsTxt = `Some factures failed:\n\n${failed.join("\n")}\n`;
      archive.append(Buffer.from(errorsTxt, "utf8"), { name: "errors.txt" });
    }

    await archive.finalize();

    if (progressId) setProgress(progressId, { status: "done" });
    // cleanup progress state after some time
    if (progressId) {
      setTimeout(() => {
        progressStore.delete(progressId);
        progressSubs.delete(progressId);
      }, 30_000);
    }
  } catch (e: any) {
    console.error("[invoiceZip] fatal:", e);
    try { archive.abort(); } catch {}
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create ZIP", message: e?.message || String(e) });
    }
    if (progressId) {
      setProgress(progressId, { status: "error", message: e?.message || "Zip failed" });
      setTimeout(() => {
        progressStore.delete(progressId);
        progressSubs.delete(progressId);
      }, 30_000);
    }
  } finally {
    try { await browser?.close(); } catch {}
  }
};

router.get("/invoices/zip", zipInvoices);
router.post("/invoices/zip", zipInvoices);

export const invoiceZipRouter = router;
export default router;
