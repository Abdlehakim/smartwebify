/* ------------------------------------------------------------------
   src/routes/dashboardadmin/client-shop/deleteClientShop.ts
   Base: /api/dashboardadmin/clientShop
   Endpoint:
     - DELETE /delete/:id
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import ClientShop from "@/models/ClientShop";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/* DELETE /delete/:id — hard delete a ClientShop */
router.delete(
  "/delete/:id",
  requirePermission("M_Access"),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      if (!isValidId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
      }

      const deleted = await ClientShop.findByIdAndDelete(id);

      if (!deleted) {
        res.status(404).json({ message: "Client not found" });
        return;
      }

      res.status(200).json({
        message: "Client deleted",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete ClientShop error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
