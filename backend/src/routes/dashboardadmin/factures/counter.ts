import express, { Request, Response } from "express";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { FactureCounter } from "@/models/Facture";

const router = express.Router();

/** GET /api/dashboardadmin/factures/counter/:year */
router.get("/:year", requirePermission("M_Access"), async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  if (!Number.isFinite(year)) return res.status(400).json({ message: "Invalid year" });

  const doc = await FactureCounter.findOne({ year }).lean();
  return res.json({ year, seq: doc?.seq ?? 0 });
});

/** PUT /api/dashboardadmin/factures/counter/:year  { seq:number } */
router.put("/:year", requirePermission("M_Access"), async (req: Request, res: Response) => {
  const year = Number(req.params.year);
  const seq = Number(req.body?.seq);
  if (!Number.isFinite(year)) return res.status(400).json({ message: "Invalid year" });
  if (!Number.isFinite(seq) || seq < 0) return res.status(400).json({ message: "Invalid seq" });

  const doc = await FactureCounter.findOneAndUpdate(
    { year },
    { $set: { seq } },
    { new: true, upsert: true }
  ).lean();

  return res.json({ year: doc.year, seq: doc.seq });
});

export default router;
