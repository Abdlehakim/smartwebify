/* ------------------------------------------------------------------
   src/routes/dashboardadmin/client-company/createClientCompany.ts
   Route : création d’un « ClientCompany »
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import ClientCompany from "@/models/ClientCompany";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * POST /api/dashboardadmin/client-company/create
 * Crée un nouveau ClientCompany
 */
router.post(
  "/create",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { companyName, contactName, phone, email, vatNumber } = req.body;

      // champs obligatoires
      if (!companyName || !phone) {
        res
          .status(400)
          .json({ message: "Missing required fields: companyName, phone" });
        return;
      }

      const newClientCompany = new ClientCompany({
        companyName,
        contactName,
        phone,
        email,
        vatNumber,
      });

      await newClientCompany.save();

      res.status(201).json({
        message: "ClientCompany created successfully",
        clientCompany: {
          _id: newClientCompany._id,
          companyName: newClientCompany.companyName,
          contactName: newClientCompany.contactName,
          phone: newClientCompany.phone,
          email: newClientCompany.email,
          vatNumber: newClientCompany.vatNumber,

        },
      });
    } catch (error) {
      console.error("Create ClientCompany Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
