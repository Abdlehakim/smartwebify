// src/routes/website/currency/getPrimaryCurrency.ts
import { Router, Request, Response } from "express";
import CurrencySettings from "@/models/payment/CurrencySettings";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/website/currency/primary

/* ------------------------------------------------------------------ */

router.get(
  "/",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // fetch only the primary field
      const settings = await CurrencySettings.findOne({}, "primary").lean();

      if (!settings) {
        res.status(404).json({ message: "Currency settings not found" });
      } else {
        res.json({ primaryCurrency: settings.primary });
      }
    } catch (err) {
      console.error("GetPrimaryCurrency Error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
