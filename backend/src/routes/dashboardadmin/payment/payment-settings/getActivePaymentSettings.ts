// src/routes/dashboardadmin/checkout/getActivePaymentSettings.ts

import { Router, Request, Response } from "express";
import PaymentMethod, { IPaymentMethod } from "@/models/payment/PaymentMethods";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/dashboardadmin/payment/payment-settings                  */
/* ------------------------------------------------------------------ */
router.get(
  "/active",
  requirePermission("M_Checkout"),
  async (_req: Request, res: Response) => {
    try {
      const activeMethods: IPaymentMethod[] = await PaymentMethod.find({ enabled: true }).lean();
      res.json({ activePaymentMethods: activeMethods });
    } catch (err) {
      console.error("GetActivePaymentSettings Error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
