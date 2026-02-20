// ───────────────────────────────────────────────────────────────
// src/pages/api/dashboardadmin/delivery-options/create.ts
// Creates a new DeliveryOption (e.g. “Standard”, “Express”, “Pickup”)
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import DeliveryOption from "@/models/dashboardadmin/DeliveryOption";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  POST /api/dashboardadmin/delivery-options/create                  */
/* ------------------------------------------------------------------ */
router.post(
  "/create",
  requirePermission("M_Checkout"), // ajustez si nécessaire
  async (req: Request, res: Response): Promise<void> => {
    try {
      /* ---------- 1) Extraction + trim des entrées ---------- */
      const name        = ((req.body.name as string)        || "").trim();
      const description = ((req.body.description as string) || "").trim();
      const priceRaw    =  req.body.price;
      const daysRaw     =  req.body.estimatedDays;
      const isActiveRaw =  req.body.isActive;
      const isPickupRaw =  req.body.isPickup;        // ⇦ NOUVEAU

      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      /* ---------- 2) Vérification des champs obligatoires ---------- */
      if (!name || priceRaw === undefined) {
        res.status(400).json({
          success: false,
          message: "Missing required fields: name, price",
        });
        return;
      }
      /* estimatedDays est exigé sauf si l’option est un retrait magasin */
      if (!Boolean(isPickupRaw) && daysRaw === undefined) {
        res.status(400).json({
          success: false,
          message: "Missing required field: estimatedDays",
        });
        return;
      }

      /* ---------- 3) Construction + sauvegarde du document ---------- */
      const option = new DeliveryOption({
        name,
        description: description || undefined,
        price: Number(priceRaw),
        estimatedDays: Boolean(isPickupRaw) ? 0 : Number(daysRaw ?? 0),
        isActive: isActiveRaw !== undefined ? Boolean(isActiveRaw) : true,
        isPickup: isPickupRaw !== undefined ? Boolean(isPickupRaw) : false, // ⇦ NOUVEAU
        createdBy: userId,
      });

      await option.save();

      res.status(201).json({
        success: true,
        message: "Delivery option created.",
        delivery: option,
      });
    } catch (err: any) {
      console.error("Create DeliveryOption Error:", err);

      /* ----- duplicate key (unique name) ----- */
      if (err.code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "Delivery option name already exists." });
        return;
      }

      /* ----- mongoose validation errors ----- */
      if (err.name === "ValidationError" && err.errors) {
        const friendly = Object.values(err.errors)
          .map((e: any) =>
            e.message.replace(
              /Path `(\w+)` is required\./,
              (_: string, field: string) =>
                `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
            )
          )
          .join(" ");
        res.status(400).json({ success: false, message: friendly });
        return;
      }

      /* ----- fallback ----- */
      res
        .status(500)
        .json({ success: false, message: err.message || "Server error." });
    }
  }
);

export default router;
