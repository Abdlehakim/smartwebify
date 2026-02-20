/* ------------------------------------------------------------------
   src/routes/stock/getMagasins.ts
   GET /api/stock/magasins
   Liste publique (mais protégée) des magasins approuvées
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import Magasin from "@/models/stock/Magasin";
import { requirePermission } from "@/middleware/requireDashboardPermission"; 
const router = Router();

/**
 * GET /api/stock/magasins
 * Permissions : M_Stock
 * Renvoie les magasins où vadmin === "approve" avec :
 *   - _id
 *   - name
 *   - phoneNumber? (facultatif)
 *   - address?     (facultatif)
 *   - city?        (facultatif)
 */
router.get(
  "/approved",
  requirePermission("M_Stock"),                // ⇦ AJOUTÉ
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const magasins = await Magasin.find({ vadmin: "approve" })
        .select("_id name phoneNumber address city")
        .sort({ name: 1 })
        .lean();

      res.json({ magasins });
    } catch (err) {
      console.error("Get Magasins Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
