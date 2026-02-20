// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/checkout/payment-currency/getCurrencySettings.ts
// Returns the current CurrencySettings document (no seeding)
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import CurrencySettings from "@/models/payment/CurrencySettings"
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/dashboardadmin/checkout/payment-currency
/* ------------------------------------------------------------------ */
router.get(
  "/",
  requirePermission("M_Checkout"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await CurrencySettings.findOne().lean();
      res.json({ currencySettings: settings });
    } catch (err) {
      console.error("getCurrencySettings Error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
