// src/routes/dashboardadmin/factures/createFacture.ts
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import Facture from "@/models/Facture";
import Order from "@/models/Order";
import { requirePermission } from "@/middleware/requireDashboardPermission";
 /////api/dashboardadmin/factures/createFacture
const router = express.Router();

router.post("/createFacture", requirePermission("M_Access"), async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  try {
    let created;
    await session.withTransaction(async () => {
      // create facture inside the tx
      const [facture] = await Facture.create([req.body], { session });
      created = facture;

      // mark the related order as invoiced inside the same tx
      await Order.updateOne(
        { _id: facture.order },
        { $set: { Invoice: true } },
        { session }
      );
    });

    return res.status(201).json({ facture: created });
  } catch (err) {
    console.error("Create Facture Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    await session.endSession();
  }
});

export default router;
