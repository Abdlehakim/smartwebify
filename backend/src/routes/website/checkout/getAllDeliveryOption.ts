import { Router, Request, Response } from "express";
import DeliveryOption from "@/models/dashboardadmin/DeliveryOption";

const router = Router();

router.get("/", async (_req: Request, res: Response) => {
  try {
    const options = await DeliveryOption.find({ isActive: true })
      .select("_id name description price estimatedDays isPickup")
      .sort({ price: 1 })
      .lean();

    const result = options.map((o) => ({
      id: o._id.toString(),
      name: o.name,
      description: o.description ?? "",
      cost: o.price,
      price: o.price,
      estimatedDays: o.estimatedDays, // ← important
      isPickup: !!o.isPickup,
    }));

    res.json(result);
  } catch (err) {
    console.error("Error fetching delivery options:", err);
    res.status(500).json({ error: "Error fetching delivery options" });
  }
});

export default router;
