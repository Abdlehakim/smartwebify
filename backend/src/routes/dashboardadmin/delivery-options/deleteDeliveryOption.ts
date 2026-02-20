// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/delivery/deleteDeliveryOption.ts
// Deletes a Delivery option by _id
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import Delivery from "@/models/dashboardadmin/DeliveryOption";          // adjust path if needed
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  DELETE /api/dashboardadmin/delivery/delete/:deliveryId            */
/* ------------------------------------------------------------------ */
router.delete(
  "/delete/:deliveryId",
  requirePermission("M_Checkout"),
  async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;

    try {
      const deleted = await Delivery.findByIdAndDelete(deliveryId);

      if (!deleted) {
        res.status(404).json({ message: "Delivery option not found" });
        return;
      }

      res.json({
        message: "Delivery option deleted successfully",
        delivery: {
          _id: deleted._id,
          name: deleted.name,
        },
      });
    } catch (error) {
      console.error("DeleteDeliveryOption Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
