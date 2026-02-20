// src/routes/dashboardadmin/factures/updateStatus.ts
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Facture from "@/models/Facture";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = express.Router();

/**
 * PUT /api/dashboardadmin/factures/updateStatus/:id
 * Body: { status: "Paid" | "Cancelled" }
 *
 * - Validates the status against the schema enum
 * - Sets paidAt / cancelledAt accordingly
 * - Uses runValidators to enforce enum validation on update
 */
router.put(
  "/updateStatus/:id",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: "Paid" | "Cancelled" };

      if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ message: "Invalid facture id" });
        return;
      }

      if (status !== "Paid" && status !== "Cancelled") {
        res.status(400).json({ message: "Invalid status. Use 'Paid' or 'Cancelled'." });
        return;
      }

      // Build atomic $set / $unset so irrelevant timestamps are cleared
      const update: {
        $set: Record<string, any>;
        $unset?: Record<string, any>;
      } = {
        $set: { status },
      };

      if (status === "Paid") {
        update.$set.paidAt = new Date();
        update.$unset = { ...(update.$unset || {}), cancelledAt: "" };
      } else {
        update.$set.cancelledAt = new Date();
        update.$unset = { ...(update.$unset || {}), paidAt: "" };
      }

      const updated = await Facture.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true, // ensure enum validation on update
      });

      if (!updated) {
        res.status(404).json({ message: "Facture not found" });
        return;
      }

      res.status(200).json({ facture: updated });
    } catch (err) {
      console.error("Update facture status error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
