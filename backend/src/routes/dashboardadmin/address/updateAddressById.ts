/* ------------------------------------------------------------------
   src/routes/dashboardadmin/address/updateAddressById.ts
   Route : mettre à jour une adresse spécifique (dashboard admin)
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import Address from "@/models/Address";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * PUT /api/dashboardadmin/clientAddress/:addressId
 */
router.put(
  "/update/:addressId",
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

      // Mise à jour uniquement des champs fournis dans le body
      address.Name = req.body.Name ?? address.Name;
      address.StreetAddress = req.body.StreetAddress ?? address.StreetAddress;
      address.Country = req.body.Country ?? address.Country;
      address.Province = req.body.Province ?? address.Province;
      address.City = req.body.City ?? address.City;
      address.PostalCode = req.body.PostalCode ?? address.PostalCode;
      address.Phone = req.body.Phone ?? address.Phone;

      await address.save();

      res
        .status(200)
        .json({ message: "Address updated successfully", address });
    } catch (error) {
      console.error("Update Address Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
