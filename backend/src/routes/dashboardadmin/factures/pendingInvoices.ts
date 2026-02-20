// src/routes/dashboardadmin/factures/pendingInvoices.ts
import { Router } from "express";
import {
  invoiceQueue,
  cancelInvoice,
  INVOICE_QUEUE,
  CREATE_INVOICE_JOB,
  INVOICE_JOB_ID_PREFIX,
} from "@/jobs/invoiceQueue";

const router = Router();

/** Normalize a BullMQ job into the shape expected by the frontend. */
function jobToPending(job: any) {
  const dataOrderId = job?.data?.orderId;
  const jobId: string = String(job?.id ?? "");
  const orderId =
    dataOrderId ??
    (jobId.startsWith(INVOICE_JOB_ID_PREFIX)
      ? jobId.slice(INVOICE_JOB_ID_PREFIX.length)
      : "unknown");

  const ts = typeof job?.timestamp === "number" ? job.timestamp : Date.now();
  const delay =
    typeof job?.opts?.delay === "number"
      ? job.opts.delay
      : typeof job?.delay === "number"
      ? job.delay
      : 0;

  const etaMs = delay ? ts + delay : ts;
  const msLeft = Math.max(0, etaMs - Date.now());
  const etaISO = new Date(etaMs).toISOString();

  return { orderId, etaISO, msLeft };
}

/**
 * GET /pending
 * Return all not-yet-processed create-invoice jobs with ETA when available.
 */
router.get("/pending", async (_req, res) => {
  try {
    // cover the usual states where a scheduled job may live
    const states: any[] = ["delayed", "waiting", "waiting-children", "paused"];
    // optionally include "active" if you still want to show a cancel right before execution:
    // states.push("active");

    const jobs = await invoiceQueue.getJobs(states as any);
    const pending = jobs
      .filter((j) => j?.name === CREATE_INVOICE_JOB)
      .map(jobToPending);

    res.json({ queue: INVOICE_QUEUE, pending });
  } catch (e: any) {
    console.error("[pendingInvoices] /pending failed:", e?.message || e);
    res.status(500).json({ error: "FAILED_TO_LIST_PENDING" });
  }
});

/**
 * DELETE /pending/:orderId
 * Cancel a scheduled invoice job for a given order across states.
 */
router.delete("/pending/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;

    // Fast path: known jobId format
    const byId = await invoiceQueue.getJob(`${INVOICE_JOB_ID_PREFIX}${orderId}`);
    if (byId) {
      await byId.remove();
      return res.json({ ok: true });
    }

    // Fallback: scan common states and match by data.orderId
    const jobs = await invoiceQueue.getJobs(
      ["delayed", "waiting", "waiting-children", "paused", "active"] as any
    );
    const job = jobs.find(
      (j) => j?.name === CREATE_INVOICE_JOB && j?.data?.orderId === orderId
    );

    if (job) {
      await job.remove();
      return res.json({ ok: true });
    }

    return res.status(404).json({ ok: false, reason: "NOT_FOUND" });
  } catch (e: any) {
    console.error("[pendingInvoices] cancel failed:", e?.message || e);
    res.status(500).json({ ok: false, error: "CANCEL_FAILED" });
  }
});

export default router;
