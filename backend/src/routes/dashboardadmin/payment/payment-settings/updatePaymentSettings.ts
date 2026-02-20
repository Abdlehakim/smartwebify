// routes/dashboardadmin/payment/payment-settings/updatePaymentSettings.ts

import { Router, Request, Response } from "express";
import PaymentMethod from "@/models/payment/PaymentMethods";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { PaymentMethodKey, PAYMENT_METHOD_KEYS } from "@/constants/paymentMethodsData";

const router = Router();

type Sub = { enabled?: boolean; label?: string; help?: string };
type Body = Partial<Record<PaymentMethodKey, Sub>>;

/* ------------------------------------------------------------------ */
/*  PUT /api/dashboardadmin/payment-settings/update                   */
/* ------------------------------------------------------------------ */
router.put(
  "/update",
  requirePermission("M_Checkout"),
  async (req: Request<{}, {}, Body>, res: Response): Promise<void> => {
    const updates = Object.entries(req.body);

    if (updates.length === 0) {
      res.status(400).json({ message: "No payment method updates provided." });
      return;
    }

    try {
      const updatedMethods = [];

      for (const [name, changes] of updates) {
        if (!PAYMENT_METHOD_KEYS.includes(name as PaymentMethodKey)) {
          continue;
        }

        const updateFields: Record<string, any> = {};
        if (changes) {
          if (changes.enabled !== undefined) updateFields.enabled = changes.enabled;
          if (changes.label !== undefined) updateFields.label = changes.label;
          if (changes.help !== undefined) updateFields.help = changes.help;
        }

        const updated = await PaymentMethod.findOneAndUpdate(
          { name },
          { $set: updateFields },
          { new: true, runValidators: true }
        ).lean();

        if (updated) {
          updatedMethods.push(updated);
        }
      }

      if (updatedMethods.length === 0) {
        res.status(404).json({ message: "No valid payment methods were updated." });
        return;
      }

      res.json({
        message: "Payment methods updated successfully.",
        updatedMethods,
      });
    } catch (err) {
      console.error("UpdatePaymentSettings Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
