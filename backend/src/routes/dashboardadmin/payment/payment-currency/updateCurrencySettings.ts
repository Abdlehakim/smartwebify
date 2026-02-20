// ───────────────────────────────────────────────────────────────
// PUT /api/dashboardadmin/checkout/payment-currency/update
// Updates primary + optional secondary currencies
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import CurrencySettings from "@/models/payment/CurrencySettings";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
router.put(
  "/update",
  requirePermission("M_Checkout"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { primary, secondaries } = req.body as {
        primary?: string;
        secondaries?: string[];
      };

      if (primary === undefined && secondaries === undefined) {
        res
          .status(400)
          .json({ message: "No currency fields supplied for update." });
        return;
      }

      /* fetch (or seed) singleton */
      let settings = await CurrencySettings.findOne();
      if (!settings) {
        settings = await CurrencySettings.create({
          primary: "TND",
          secondaries: [],
        });
      }

      /* apply changes */
      if (primary !== undefined) settings.primary = primary.toUpperCase();
      if (secondaries !== undefined)
        settings.secondaries = secondaries.map((c) => c.toUpperCase());

      /* validation will ensure primary ∉ secondaries */
      await settings.save();

      res.json({
        message: "Currency settings updated.",
        currencySettings: settings.toObject(),
      });
    } catch (err: any) {
      console.error("UpdateCurrencySettings Error:", err);
      res.status(500).json({ message: err.message || "Internal server error" });
    }
  }
);

export default router;
