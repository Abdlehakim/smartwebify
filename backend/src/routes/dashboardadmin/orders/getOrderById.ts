/* ------------------------------------------------------------------
   src/routes/dashboardadmin/orders/getOrderById.ts
   GET /api/dashboardadmin/orders/:orderId
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import mongoose, { Types } from "mongoose";

import Order from "@/models/Order";
import Client from "@/models/Client";
import ClientShop from "@/models/ClientShop";
import ClientCompany from "@/models/ClientCompany";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

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
  /* ---------- Account ---------- */
  const acc = await Client.findById(id).select("username phone email").lean();
  if (acc)
    return {
      _id: acc._id.toString(),
      username: acc.username,
      phone: acc.phone,
      email: acc.email,
      origin: "account",
    };

  /* ---------- Shop ---------- */
  const shop = await ClientShop.findById(id)
    .select("name phone email")
    .lean();
  if (shop)
    return {
      _id: shop._id.toString(),
      name: shop.name,
      phone: shop.phone,
      email: shop.email,
      origin: "shop",
    };

  /* ---------- Company ---------- */
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


router.get(
  "/:orderId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    /* ---------- validation ---------- */
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID." });
      return;
    }

    try {
      /* ---------- fetch order ---------- */
      const orderDoc = await Order.findById(orderId).lean();
      if (!orderDoc) {
        res.status(404).json({ message: "Order not found." });
        return;
      }

      /* ---------- extract client ID (populated or not) ---------- */
      const clientIdRaw =
        (orderDoc.client as any)?._id ?? (orderDoc.client as Types.ObjectId);

      const client = await resolveClient(clientIdRaw);

      /* ---------- response ---------- */
      res.status(200).json({
        order: {
          ...orderDoc,
          client,
        },
      });
    } catch (err) {
      console.error("GetOrderById error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

export default router;
