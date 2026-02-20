// src/routes/website/checkout/getPaymentMethode.ts

import { Router, Request, Response } from "express";
import PaymentMethod from "@/models/payment/PaymentMethods";

const router = Router();

/** Simple: return all active (enabled) payment methods with needed fields */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const methods = await PaymentMethod.find({ enabled: true })
      .select("name label help payOnline requireAddress")
      .lean();

    res.json(methods);
  } catch (err) {
    console.error("Error fetching payment methods:", err);
    res.status(500).json({ error: "Error fetching payment methods" });
  }
});

export default router;
