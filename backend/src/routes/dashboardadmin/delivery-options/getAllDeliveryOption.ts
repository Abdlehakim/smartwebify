// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/delivery-options/getAllDeliveryOptions.ts
// GET /api/dashboardadmin/delivery-options/all?page=1&limit=20&active=true
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import DeliveryOption from "@/models/dashboardadmin/DeliveryOption";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/dashboardadmin/delivery-options/all                      */
/* ------------------------------------------------------------------ */
router.get(
  "/all",
  requirePermission("M_Checkout"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      /* ---------- query-string params ---------- */
      const page  = Math.max(Number(req.query.page)  || 1, 1);
      const limit = Math.max(Number(req.query.limit) || 20, 1);
      const activeFilter =
        req.query.active !== undefined
          ? { isActive: req.query.active === "true" }
          : {};

      /* ---------- database query ---------- */
      const [options, total] = await Promise.all([
        DeliveryOption.find(activeFilter)
          .populate("createdBy", "username")   
          .populate("updatedBy", "username")
          .sort({ name: 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),                           
        DeliveryOption.countDocuments(activeFilter),
      ]);

      res.json({
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        deliveryOptions: options,
      });
    } catch (error) {
      console.error("GetAllDeliveryOptions Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
