/* ------------------------------------------------------------------
   src/routes/dashboardadmin/client-shop/createClientShop.ts
   Route : création d’un « ClientShop » (client magasin)
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import ClientShop from "@/models/ClientShop";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * POST /api/dashboardadmin/client-shop/create
 * Crée un nouveau ClientShop
 */
router.post(
  "/create",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, phone, email } = req.body;

      // Vérification des champs requis
      if (!name || !phone) {
        res.status(400).json({
          message: "Missing required fields: name, phone",
        });
        return;
      }

      // Création de l’instance
      const newClientShop = new ClientShop({
        name,
        phone,
        email,
      });

      // Enregistrement
      await newClientShop.save();

      // Réponse
      res.status(201).json({
        message: "ClientShop created successfully",
        clientShop: {
          _id: newClientShop._id,
          name: newClientShop.name,
          phone: newClientShop.phone,
          email: newClientShop.email,
        },
      });
    } catch (error) {
      console.error("Create ClientShop Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
