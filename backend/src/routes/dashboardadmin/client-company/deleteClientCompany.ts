/* ------------------------------------------------------------------
   src/routes/dashboardadmin/client-company/deleteClientCompany.ts
   DELETE /api/dashboardadmin/clientCompany/delete/:id
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import ClientCompany from "@/models/ClientCompany";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ---------- helpers ---------- */
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

/**
 * DELETE /delete/:id
 * Hard-deletes a ClientCompany document by id.
 * NOTE: If you need to prevent deletion when there are dependencies
 * (orders/invoices/etc.), add your checks before performing the delete.
 */
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

      const deleted = await ClientCompany.findByIdAndDelete(id);

      if (!deleted) {
        res.status(404).json({ message: "Company not found" });
        return;
      }

      res.status(200).json({
        message: "Company deleted",
        deletedId: id,
      });
    } catch (error) {
      console.error("Delete ClientCompany error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
