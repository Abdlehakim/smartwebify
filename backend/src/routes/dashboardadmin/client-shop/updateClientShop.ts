/* ------------------------------------------------------------------
   src/routes/dashboardadmin/client-shop/updateClientShop.ts
   Base: /api/dashboardadmin/clientShop
   Endpoints:
     - GET    /:id
     - PATCH  /update/:id
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import ClientShop from "@/models/ClientShop";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

const isValidId = (id: string) => mongoose.Types.ObjectId.isValid(id);

type Body = {
  name?: string;
  phone?: string;
  email?: string;
};

/* GET /:id — fetch one client for edit */
router.get(
  "/:id",
  requirePermission("M_Access"),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
      }
      const client = await ClientShop.findById(id);
      if (!client) {
        res.status(404).json({ message: "Client not found" });
        return;
      }
      res.status(200).json({ client });
    } catch (error) {
      console.error("Get ClientShop by id error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

/* PATCH /update/:id — update one client */
router.patch(
  "/update/:id",
  requirePermission("M_Access"),
  async (req: Request<{ id: string }, {}, Body>, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      if (!isValidId(id)) {
        res.status(400).json({ message: "Invalid id" });
        return;
      }

      const payload = req.body ?? {};
      const update: Body = {};

      if (typeof payload.name === "string") update.name = payload.name.trim();
      if (typeof payload.phone === "string") update.phone = payload.phone.trim();
      if (typeof payload.email === "string") update.email = payload.email.trim();

      const client = await ClientShop.findByIdAndUpdate(id, update, {
        new: true,
        runValidators: true,
      });

      if (!client) {
        res.status(404).json({ message: "Client not found" });
        return;
      }

      res.status(200).json({ message: "Client updated", client });
    } catch (error: any) {
      console.error("Update ClientShop error:", error);
      if (error?.name === "ValidationError") {
        res.status(400).json({ message: error.message });
        return;
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
