/* ------------------------------------------------------------------
   src/routes/dashboardadmin/address/getAddressByClient.ts
   Route : récupérer toutes les adresses liées à un client donné
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import Address from "@/models/Address";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/clientAddress/:clientId
 * Renvoie toutes les adresses (triées par date desc.) du client ciblé.
 */
router.get(
  "/:clientId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;

      if (!clientId) {
        res.status(400).json({ message: "Missing clientId parameter." });
        return;
      }

      const addresses = await Address.find({ client: clientId })
        .sort({ createdAt: -1 })
        .lean();

      res.status(200).json({ addresses });
    } catch (error) {
      console.error("Get Address By Client Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
