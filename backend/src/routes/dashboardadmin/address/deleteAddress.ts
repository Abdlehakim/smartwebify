/* ------------------------------------------------------------------
   src/routes/dashboardadmin/address/deleteAddressById.ts
   Route : supprimer une adresse (dashboard admin)
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import Address from "@/models/Address";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * DELETE /api/dashboardadmin/clientAddress/:addressId
 * Supprime l’adresse ciblée.
 */
router.delete(
  "/:addressId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { addressId } = req.params;

      if (!addressId) {
        res.status(400).json({ message: "Missing addressId parameter." });
        return;
      }

      const address = await Address.findById(addressId);
      if (!address) {
        res.status(404).json({ message: "Address not found" });
        return;
      }

      await address.deleteOne(); // suppression définitive
      res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error("Delete Address Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
