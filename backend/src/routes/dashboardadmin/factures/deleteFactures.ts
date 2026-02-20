/* ------------------------------------------------------------------
   src/routes/dashboardadmin/factures/deleteFactures.ts
   POST /api/dashboardadmin/factures/delete
   Body: { ids: string[] }  // bulk delete by ids
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import Facture, { FactureCounter } from "@/models/Facture";
import Order from "@/models/Order";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* Small helpers */
const isValidId = (s: string) => Types.ObjectId.isValid(s);

router.post(
  "/delete",
  // If you have a stricter permission for destructive actions, change to e.g. "M_Delete"
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const ids = (req.body?.ids ?? []) as unknown;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({ message: "Provide non-empty 'ids' array." });
        return;
      }

      // sanitize + dedupe
      const unique = Array.from(new Set(ids.map(String)));
      const invalidIds: string[] = unique.filter((id) => !isValidId(id));
      const candidateIds = unique.filter((id) => isValidId(id));

      if (candidateIds.length === 0) {
        res.status(400).json({
          message: "No valid ObjectIds found in 'ids'.",
          invalidIds,
        });
        return;
      }

      // find existing (include fields needed for order sync + renumbering)
      const existing = await Facture.find({
        _id: { $in: candidateIds },
      })
        .select("_id order year seq ref")
        .lean();

      const existingIdStrs = new Set(existing.map((d) => d._id.toString()));
      const notFoundIds = candidateIds.filter((id) => !existingIdStrs.has(id));

      // related orders to update
      const orderIds = Array.from(
        new Set(
          existing
            .map((d) => d.order && String(d.order))
            .filter((v): v is string => Boolean(v))
        )
      );

      // group deleted sequences by year for renumbering
      const byYear = new Map<number, number[]>();
      for (const f of existing) {
        const arr = byYear.get(f.year) ?? [];
        arr.push(Number(f.seq));
        byYear.set(f.year, arr);
      }
      // sort each year's deleted seqs asc
      for (const [y, arr] of byYear) {
        arr.sort((a, b) => a - b);
        byYear.set(y, arr);
      }

      // 1) delete factures
      const toDelete = Array.from(existingIdStrs);
      const delRes = await Facture.deleteMany({ _id: { $in: toDelete } });

      // 2) sync related orders: Invoice=false + orderStatus="Cancelled"
      let ordersUpdated = 0;
      if (orderIds.length) {
        const updRes = await Order.updateMany(
          { _id: { $in: orderIds } },
          { $set: { Invoice: false, orderStatus: "Cancelled" } }
        );
        ordersUpdated = updRes.modifiedCount ?? 0;
      }

      // 3) renumber remaining factures in each affected year
      //    For each year, for each remaining facture we compute:
      //    newSeq = seq - count(deletedSeq < seq)
      //    and set ref = `FC-${newSeq}-${year}`
      //    This is done in ONE aggregation-pipeline update per year (atomic, collision-free).
      const renumberResults: Array<{
        year: number;
        deletedSeqs: number[];
        modified: number;
        counterSeq: number;
      }> = [];

      for (const [year, deletedSeqs] of byYear) {
        if (!deletedSeqs.length) continue;

        // Only docs from this year need to be considered.
        // The pipeline computes the decrement per-document based on deletedSeqs.
        const pipeline = [
          {
            $set: {
              _dec: {
                $size: {
                  $filter: {
                    input: deletedSeqs, // literal array
                    as: "x",
                    cond: { $lt: ["$$x", "$seq"] },
                  },
                },
              },
            },
          },
          {
            $set: {
              seq: { $subtract: ["$seq", "$_dec"] },
              ref: {
                $concat: [
                  "FC-",
                  { $toString: { $subtract: ["$seq", "$_dec"] } },
                  "-",
                  { $toString: "$year" },
                ],
              },
            },
          },
          { $unset: "_dec" },
        ] as any[];

        // Limit to rows where seq > min(deletedSeqs) to avoid useless writes
        const minDeleted = deletedSeqs[0];
        const upd = await Facture.updateMany({ year, seq: { $gt: minDeleted } }, pipeline);

        // refresh counter: set to max seq remaining (or 0 if none)
        const top = await Facture.findOne({ year }).select("seq").sort({ seq: -1 }).lean();
        const newMax = top?.seq ?? 0;
        await FactureCounter.findOneAndUpdate(
          { year },
          { $set: { seq: newMax } },
          { upsert: true, new: true }
        ).lean();

        renumberResults.push({
          year,
          deletedSeqs,
          modified: upd.modifiedCount ?? 0,
          counterSeq: newMax,
        });
      }

      res.status(200).json({
        ok: true,
        requested: unique.length,
        deleted: delRes.deletedCount ?? 0,
        ordersUpdated,
        invalidIds,
        notFoundIds,
        renumbered: renumberResults,
      });
    } catch (err) {
      console.error("[deleteFactures] error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
