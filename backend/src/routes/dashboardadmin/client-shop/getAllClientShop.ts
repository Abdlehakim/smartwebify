/* ------------------------------------------------------------------
   src/routes/dashboardadmin/client-shop/getAllClientShop.ts
   Route : récupérer la liste complète des « ClientShop »
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import ClientShop from "@/models/ClientShop";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/getAllClientShops
 * Renvoie tous les ClientShop (clients magasin)
 */
router.get(
  "/",
  requirePermission("M_Access"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const clients = await ClientShop.find().sort({ createdAt: -1 });
      res.status(200).json({ clients });
    } catch (error) {
      console.error("GetAll ClientShop Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
