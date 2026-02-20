// src/routes/website/checkout/getAllAprovedMagasin.ts
import { Router, Request, Response } from "express";
import Magasin from "@/models/stock/Magasin";

const router = Router();

/** Return all approved magasins for checkout pickup selection */
router.get("/", async (_req: Request, res: Response): Promise<void> => {
  try {
    const mags = await Magasin.find({ vadmin: "approve" })
      .select("_id name address phoneNumber city")
      .sort({ name: 1 })
      .lean();

    res.json(
      mags.map((m) => ({
        _id: m._id.toString(),
        name: m.name,
        address: m.address ?? "",
        phoneNumber: m.phoneNumber ?? "",
        city: m.city ?? "",
      }))
    );
  } catch (err) {
    console.error("Error fetching approved magasins:", err);
    res.status(500).json({ error: "Error fetching approved magasins" });
  }
});

export default router;
