/* ------------------------------------------------------------------
   src/routes/dashboardadmin/factures/getFcById.ts
   GET /api/dashboardadmin/factures/:fcid
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import mongoose, { Types } from "mongoose";

import Facture from "@/models/Facture";
import Client from "@/models/Client";
import ClientShop from "@/models/ClientShop";
import ClientCompany from "@/models/ClientCompany";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ---------- resolve client (same approach as orders route) ---------- */
async function resolveClient(
  id: Types.ObjectId | string,
): Promise<
  | {
      _id: string;
      username?: string;
      name?: string;
      phone?: string;
      email?: string;
      origin: "account" | "shop" | "company";
    }
  | null
> {
  // Account
  const acc = await Client.findById(id).select("username phone email").lean();
  if (acc)
    return {
      _id: acc._id.toString(),
      username: acc.username,
      phone: acc.phone,
      email: acc.email,
      origin: "account",
    };

  // Shop
  const shop = await ClientShop.findById(id).select("name phone email").lean();
  if (shop)
    return {
      _id: shop._id.toString(),
      name: shop.name,
      phone: shop.phone,
      email: shop.email,
      origin: "shop",
    };

  // Company
  const comp = await ClientCompany.findById(id)
    .select("companyName phone email")
    .lean();
  if (comp)
    return {
      _id: comp._id.toString(),
      name: comp.companyName,
      phone: comp.phone,
      email: comp.email,
      origin: "company",
    };

  return null;
}

/* ---------- GET /:fcid ---------- */
router.get(
  "/:fcid",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    const { fcid } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(fcid)) {
      res.status(400).json({ message: "Invalid facture ID." });
      return;
    }

    try {
      // Read facture (lean)
      const fcDoc = await Facture.findById(fcid).lean();
      if (!fcDoc) {
        res.status(404).json({ message: "Facture not found." });
        return;
      }

      // Optional: resolve linked client (like orders route)
      const clientIdRaw = fcDoc.client as any as Types.ObjectId | string;
      const client = await resolveClient(clientIdRaw);

      // Respond as { facture } (frontend expects fetchFromAPI<{ facture: Facture }>())
      res.status(200).json({
        facture: {
          ...fcDoc,
          client, // non-breaking extra info for UI if needed
        },
      });
    } catch (err) {
      console.error("[getFcById] error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
