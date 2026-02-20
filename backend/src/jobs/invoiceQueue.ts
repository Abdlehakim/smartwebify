// src/jobs/invoiceQueue.ts
import { Queue } from "bullmq";
import mongoose from "mongoose";
import { redis as connection } from "./redis";
import Order from "@/models/Order";

// Queue + job naming (single source of truth)
export const INVOICE_QUEUE = "invoiceQueue";
export const CREATE_INVOICE_JOB = "create-invoice";
export const INVOICE_JOB_ID_PREFIX = "invoice:";

export const invoiceQueue = new Queue(INVOICE_QUEUE, { connection });

const jobKey = (orderId: string) => `${INVOICE_JOB_ID_PREFIX}${orderId}`;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI);
}

async function isAlreadyInvoiced(orderId: string): Promise<boolean> {
  await connectDB();
  // If Invoice has select:false in schema, "+Invoice" forces inclusion
  const o = await Order.findById(orderId).select("+Invoice Invoice").lean();
  return !!o?.Invoice;

  // Optionally also check a Facture model exists for orderId if you want:
  // const f = await Facture.findOne({ orderId }).select("_id").lean();
  // return !!f || !!o?.Invoice;
}

export async function scheduleInvoiceIfNeeded(orderId: string, delayMs?: number) {
  const id = jobKey(orderId);

  if (await isAlreadyInvoiced(orderId)) {
    const existing = await invoiceQueue.getJob(id);
    if (existing) await existing.remove();
    console.log(`[invoiceQueue] Skip scheduling — already invoiced order=${orderId}`);
    return;
  }

  const baseDelay =
    typeof delayMs === "number"
      ? delayMs
      : Number(process.env.INVOICE_DELAY_MS ?? 5 * 60 * 1000);

  // de-dupe any previous job for same order
  const existing = await invoiceQueue.getJob(id);
  if (existing) await existing.remove();

  const etaISO = new Date(Date.now() + baseDelay).toISOString();
  console.log(
    `[invoiceQueue] Scheduled facture for order=${orderId} jobId=${id} delay=${baseDelay}ms ETA=${etaISO}`
  );

  await invoiceQueue.add(
    CREATE_INVOICE_JOB,
    { orderId, eta: etaISO, scheduledAt: Date.now() },
    {
      jobId: id,
      delay: baseDelay,
      attempts: 8,
      backoff: { type: "fixed", delay: baseDelay },
      removeOnComplete: true,
      removeOnFail: 50,
    }
  );
}

export async function cancelInvoice(orderId: string): Promise<{
  ok: boolean;
  cancelled?: true;
  reason?: "NOT_FOUND";
  msLeft?: number;
  etaISO?: string;
  prevState?: string;
  jobId?: string;
}> {
  const id = jobKey(orderId);
  const job = await invoiceQueue.getJob(id);

  if (!job) {
    console.log(
      `[invoiceQueue] No scheduled job to cancel for order=${orderId} jobId=${id}`
    );
    return { ok: false, reason: "NOT_FOUND" };
  }

  // Collect info before removal
  let prevState = "unknown";
  try {
    prevState = await job.getState(); // "delayed" | "waiting" | "active" | ...
  } catch {}

  const ts = typeof job.timestamp === "number" ? job.timestamp : Date.now();
  const delay =
    typeof (job as any)?.opts?.delay === "number"
      ? (job as any).opts.delay
      : typeof (job as any)?.delay === "number"
      ? (job as any).delay
      : 0;

  const etaMs = ts + delay;
  const msLeft = Math.max(0, etaMs - Date.now());
  const etaISO = new Date(etaMs).toISOString();

  await job.remove();

  console.log(
    `[invoiceQueue] CANCELLED jobId=${id} order=${orderId} prevState=${prevState} msLeft=${msLeft}ms eta=${etaISO}`
  );

  return { ok: true, cancelled: true, msLeft, etaISO, prevState, jobId: id };
}
