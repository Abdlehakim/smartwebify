// src/routes/dashboardadmin/checkout/getPaymentSettings.ts

import { Router, Request, Response } from "express";
import PaymentMethod, { IPaymentMethod } from "@/models/payment/PaymentMethods";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/dashboardadmin/payment-settings                          */
/* ------------------------------------------------------------------ */
router.get(
  "/",
  requirePermission("M_Checkout"),
  async (_req: Request, res: Response) => {
    try {
      const methods: IPaymentMethod[] = await PaymentMethod.find().lean();
      res.json({ paymentMethods: methods }); // ✅ Fixed casing
    } catch (err) {
      console.error("GetPaymentSettings Error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
