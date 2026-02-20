// src/jobs/invoiceWorker.ts
import { Worker, QueueEvents } from "bullmq";
import mongoose from "mongoose";
import { INVOICE_QUEUE } from "@/jobs/invoiceQueue";
import { redis as connection } from "@/jobs/redis";
import { createFactureFromOrder } from "@/services/factureService";
import Order from "@/models/Order";

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI not set");
  await mongoose.connect(process.env.MONGODB_URI);
}

export const invoiceWorker = new Worker(
  INVOICE_QUEUE,
  async (job) => {
    if (job.name !== "create-invoice") return;
    await connectDB();

    const { orderId, eta, scheduledAt } = job.data as {
      orderId: string;
      eta?: string;
      scheduledAt?: number;
    };

    job.log(
      `ACTIVE order=${orderId} scheduledAt=${
        scheduledAt ? new Date(scheduledAt).toISOString() : "n/a"
      } ETA=${eta ?? "n/a"}`
    );

    const result = await createFactureFromOrder(orderId);

    // Mark the order as invoiced on success or if it already existed
    if ((result.ok && result.ref) || result.already) {
      try {
        await Order.updateOne({ _id: orderId }, { $set: { Invoice: true } }).exec();
        job.log(`[invoiceWorker] set Invoice=true for order=${orderId}`);
      } catch (e) {
        job.log(
          `[invoiceWorker] WARN could not set Invoice=true for order=${orderId}: ${
            (e as Error).message
          }`
        );
      }
    }

    if (result.ok && result.ref) return { ref: result.ref };
    if (result.already) return { already: true, ref: result.ref };

    if (!result.ok && result.reason === "NOT_ELIGIBLE") {
      throw new Error("NOT_ELIGIBLE_RETRY"); // trigger BullMQ retry/backoff
    }
    if (!result.ok && result.reason === "ORDER_NOT_FOUND") {
      throw new Error("ORDER_NOT_FOUND"); // terminal fail
    }
    throw new Error("UNKNOWN_REASON");
  },
  { connection, concurrency: 5 }
);

// QueueEvents for logging lifecycle (including cancellations/removals)
const invoiceQueueEvents = new QueueEvents(INVOICE_QUEUE, { connection });

// When a delayed job is moved to active (just for nice traces)
invoiceQueueEvents.on("active", ({ jobId }) => {
  console.log(`[invoiceWorker] ACTIVE jobId=${jobId}`);
});

// Completed / failed (existing)
invoiceQueueEvents.on("completed", ({ jobId }) =>
  console.log(`[invoiceWorker] COMPLETED jobId=${jobId}`)
);
invoiceQueueEvents.on("failed", ({ jobId, failedReason }) =>
  console.error(`[invoiceWorker] FAILED jobId=${jobId} ${failedReason}`)
);

// ⬇️ NEW: log when a job is removed (typically via cancellation)
// We derive the orderId since your jobId format is "invoice:<orderId>"
invoiceQueueEvents.on("removed", ({ jobId }) => {
  const orderId =
    typeof jobId === "string" && jobId.startsWith("invoice:")
      ? jobId.slice("invoice:".length)
      : "unknown";
  console.log(
    `[invoiceWorker] REMOVED (cancelled) jobId=${jobId} order=${orderId}`
  );
});

// (Optional) log when a job becomes delayed (scheduled)
invoiceQueueEvents.on("delayed", ({ jobId, delay }) => {
  console.log(`[invoiceWorker] DELAYED jobId=${jobId} delay=${delay}ms`);
});

// graceful shutdown
async function shutdown() {
  try {
    await invoiceWorker.close();
  } catch {}
  try {
    await invoiceQueueEvents.close();
  } catch {}
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
