// src/routes/dashboardadmin/factures/getAllfactures.ts
import express, { Request, Response } from "express";
import Facture from "@/models/Facture";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = express.Router();

// GET /api/dashboardadmin/factures
router.get("/", requirePermission("M_Access"), async (_req: Request, res: Response) => {
  try {
    const factures = await Facture.find().sort({ createdAt: -1 });
    res.status(200).json({ factures });
  } catch (err) {
    console.error("Get Factures Error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
