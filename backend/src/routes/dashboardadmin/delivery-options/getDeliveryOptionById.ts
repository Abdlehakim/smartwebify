// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/delivery/getDeliveryOptionById.ts
// Returns a single Delivery option by _id
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import Delivery from "@/models/dashboardadmin/DeliveryOption";        // adjust path if different
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/dashboardadmin/delivery/:deliveryId                       */
/* ------------------------------------------------------------------ */
router.get(
  "/:deliveryId",
  requirePermission("M_Checkout"),
  async (req: Request, res: Response): Promise<void> => {
    const { deliveryId } = req.params;

    try {
      const delivery = await Delivery.findById(deliveryId);

      if (!delivery) {
        res.status(404).json({ message: "Delivery option not found" });
        return;
      }

      res.json({ delivery });
    } catch (error) {
      console.error("GetDeliveryOptionById Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
