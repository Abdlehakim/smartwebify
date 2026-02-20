/* ------------------------------------------------------------------
   src/routes/dashboardadmin/address/postAddress.ts
   Route : créer une nouvelle adresse pour un client donné
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import Address from "@/models/Address";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * POST /api/dashboardadmin/clientAddress/:clientId
 * Crée et renvoie une nouvelle adresse associée au client ciblé.
 */
router.post(
  "/:clientId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { clientId } = req.params;

      if (!clientId) {
        res.status(400).json({ message: "Missing clientId parameter." });
        return;
      }

      const {
        Name,
        StreetAddress,
        Country,
        Province,
        City,
        PostalCode,
        Phone,
      } = req.body;

      const newAddress = new Address({
        Name,
        StreetAddress,
        Country,
        Province,
        City,
        PostalCode,
        Phone,
        client: clientId,
      });

      const savedAddress = await newAddress.save();

      res.status(201).json({ address: savedAddress });
    } catch (error) {
      console.error("Create Address Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
