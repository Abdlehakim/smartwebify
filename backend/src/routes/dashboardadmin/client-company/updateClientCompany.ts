/* ------------------------------------------------------------------
   src/routes/dashboardadmin/client-company/updateClientCompany.ts
   Endpoints:
     - GET    /api/dashboardadmin/clientCompany/:id
     - PATCH  /api/dashboardadmin/clientCompany/update/:id
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import ClientCompany from "@/models/ClientCompany";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ---------- helpers ---------- */
const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

type Body = {
  companyName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  vatNumber?: string;
};

/* ------------------------------------------------------------------
   GET /:id  -> fetch one company (for edit form)
------------------------------------------------------------------ */
router.get(
  "/:id",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
      }
      const company = await ClientCompany.findById(id);
      if (!company) {
        res.status(404).json({ message: "Company not found" });
        return;
      }
      res.status(200).json({ company });
    } catch (error) {
      console.error("Get ClientCompany by id error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* ------------------------------------------------------------------
   PATCH /update/:id  -> update one company
------------------------------------------------------------------ */
router.patch(
  "/update/:id",
  requirePermission("M_Access"),
  async (req: Request< { id: string }, {}, Body>, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
      }

      const payload = req.body ?? {};
      const update: Body = {};

      if (typeof payload.companyName === "string") update.companyName = payload.companyName.trim();
      if (typeof payload.contactName === "string") update.contactName = payload.contactName.trim();
      if (typeof payload.phone === "string") update.phone = payload.phone.trim();
      if (typeof payload.email === "string") update.email = payload.email.trim();
      if (typeof payload.vatNumber === "string") update.vatNumber = payload.vatNumber.trim();

      const company = await ClientCompany.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      if (!company) {
        res.status(404).json({ message: "Company not found" });
        return;
      }

      res.status(200).json({ message: "Company updated", company });
    } catch (error: any) {
      console.error("Update ClientCompany error:", error);
      // surface mongoose validation errors
      if (error?.name === "ValidationError") {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
