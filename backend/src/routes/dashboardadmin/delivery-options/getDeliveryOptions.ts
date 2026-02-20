// ───────────────────────────────────────────────────────────────
// src/routes/website/checkout/getDeliveryOptions.ts
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import DeliveryOption from "@/models/dashboardadmin/DeliveryOption";

const router = Router();

/* ================================================================== */
/*  GET /api/checkout/delivery-options                                 */
/* ================================================================== */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const options = await DeliveryOption.find({ isActive: true })
      .select("_id name description price estimatedDays isPickup")
      .sort({ price: 1 })
      .lean();

    /* ---------- map to frontend shape ---------- */
    const result = options.map((o) => ({
      _id:          o._id.toString(),
      name:         o.name,
      description:  o.description ?? "",
      price:        o.price,
      estimatedDays: o.estimatedDays, 
      isPickup:     o.isPickup,     
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching delivery options:", err);
    res.status(500).json({ error: "Error fetching delivery options" });
  }
});

export default router;
