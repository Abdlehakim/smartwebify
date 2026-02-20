/* ------------------------------------------------------------------
   backend/src/routes/dashboardadmin/orders/updateOrder.ts
   PATCH /api/dashboardadmin/orders/update/:orderId
------------------------------------------------------------------ */

import express, { Request, Response } from "express";
import mongoose from "mongoose";

import Order, { IOrder } from "@/models/Order";
import Client from "@/models/Client";
import ClientShop from "@/models/ClientShop";
import ClientCompany from "@/models/ClientCompany";
import Facture, { IFacture } from "@/models/Facture";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = express.Router();

/** Return a usable id only if it's an ObjectId or a 24-hex string. */
function keepId(v: any): any | undefined {
  // allow ObjectId instance
  if (v instanceof mongoose.Types.ObjectId) return v;
  // allow 24-hex strings
  if (typeof v === "string" && mongoose.isObjectIdOrHexString(v)) return v;
  // allow objects with {_id} or {id}
  const cand = v && (v._id ?? v.id);
  if (typeof cand === "string" && mongoose.isObjectIdOrHexString(cand)) return cand;
  if (cand instanceof mongoose.Types.ObjectId) return cand;
  return undefined;
}

async function resolveClientName(id: string): Promise<string | null> {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;

  const account = await Client.findById(id).select("username").lean<{ username?: string }>();
  if (account) return account.username ?? "";

  const shop = await ClientShop.findById(id).select("name").lean<{ name?: string }>();
  if (shop) return shop.name ?? "";

  const company = await ClientCompany.findById(id).select("companyName").lean<{ companyName?: string }>();
  if (company) return company.companyName ?? "";

  return null;
}

/** Map Order -> Facture snapshots and recompute totals (no manual ObjectId construction). */
function projectOrderToFactureUpdate(order: IOrder): {
  set: Partial<IFacture>;
  items: IFacture["items"];
} {
  // ---- snapshots (first selected option) ----
  const addr = Array.isArray(order.DeliveryAddress) ? order.DeliveryAddress[0] : undefined;
  const mag  = Array.isArray(order.pickupMagasin)   ? order.pickupMagasin[0]   : undefined;
  const pay  = Array.isArray(order.paymentMethod)   ? order.paymentMethod[0]   : undefined;
  const del  = Array.isArray(order.deliveryMethod)  ? order.deliveryMethod[0]  : undefined;

  const deliveryAddress = addr && keepId(addr.AddressID)
    ? { AddressID: keepId(addr.AddressID)!, DeliverToAddress: String(addr.DeliverToAddress ?? "") }
    : undefined;

  const pickupMagasin = mag && keepId(mag.MagasinID)
    ? {
        MagasinID: keepId(mag.MagasinID)!,
        MagasinAddress: String(mag.MagasinAddress ?? ""),
        MagasinName: mag.MagasinName ? String(mag.MagasinName) : undefined,
      }
    : undefined;

  const paymentMethod = pay && keepId(pay.PaymentMethodID)
    ? { PaymentMethodID: keepId(pay.PaymentMethodID)!, PaymentMethodLabel: String(pay.PaymentMethodLabel ?? "") }
    : undefined;

  const deliveryMethod = del && keepId(del.deliveryMethodID)
    ? {
        deliveryMethodID: keepId(del.deliveryMethodID)!,
        deliveryMethodName: del.deliveryMethodName ? String(del.deliveryMethodName) : undefined,
        Cost: String(del.Cost ?? "0"),
        expectedDeliveryDate: del.expectedDeliveryDate ? new Date(del.expectedDeliveryDate) : undefined,
      }
    : undefined;

  // ---- items: drop any line without a valid product id ----
  const items: IFacture["items"] = Array.isArray((order as any).orderItems)
    ? (order as any).orderItems
        .map((it: any) => {
          const product = keepId(it.product ?? it.ProductID);
          if (!product) return null;

          const attributes =
            Array.isArray(it.attributes)
              ? it.attributes
                  .map((a: any) => {
                    const attribute = keepId(a.attribute ?? a.AttributeID);
                    return attribute
                      ? {
                          attribute,
                          name: String(a.name ?? a.AttributeName ?? ""),
                          value: String(a.value ?? a.AttributeValue ?? ""),
                        }
                      : null;
                  })
                  .filter(Boolean)
              : [];

          return {
            product,
            reference: String(it.reference ?? it.ref ?? ""),
            name: String(it.name ?? it.productName ?? ""),
            tva: Number(it.tva ?? 0),
            quantity: Number(it.quantity ?? it.qty ?? 1),
            discount: Number(it.discount ?? 0),
            price: Number(it.price ?? it.unitPrice ?? 0),
            attributes,
          };
        })
        .filter(Boolean) as IFacture["items"]
    : [];

  // ---- totals (best effort) ----
  const shippingCost = (() => {
    const costStr = (deliveryMethod?.Cost ?? "0").toString();
    const parsed = parseFloat(costStr.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  })();

  let subtotalHT = 0;
  let tvaTotal = 0;
  for (const li of items) {
    const unitNet = Math.max(0, li.price - (li.discount ?? 0)); // absolute discount per unit
    const lineNet = unitNet * li.quantity;
    const lineTVA = (lineNet * (li.tva ?? 0)) / 100;
    subtotalHT += lineNet;
    tvaTotal += lineTVA;
  }
  const grandTotalTTC = subtotalHT + tvaTotal + shippingCost;

  const set: Partial<IFacture> = {
    orderRef: (order as any).ref ?? undefined,
    client: (order as any).client, // let Mongoose cast strings -> ObjectId
    clientName: (order as any).clientName ?? "",
    deliveryAddress,
    pickupMagasin,
    paymentMethod,
    deliveryMethod,
    shippingCost,
    subtotalHT,
    tvaTotal,
    grandTotalTTC,
  };

  return { set, items };
}

router.patch(
  "/update/:orderId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Paramètre orderId invalide." });
      return;
    }

    try {
      const body = req.body as Partial<IOrder> & { clientId?: string | null; client?: string | null };

      const { DeliveryAddress, pickupMagasin, orderItems, paymentMethod, deliveryMethod } = body;
      const rawClientId = body.client ?? body.clientId;

      const update: Partial<IOrder> & { clientName?: string } = {};

      // client / clientName
      if (typeof rawClientId !== "undefined") {
        if (rawClientId) {
          if (!mongoose.isObjectIdOrHexString(rawClientId)) {
            res.status(400).json({ message: "Identifiant client invalide." });
            return;
          }
          // Let Mongoose cast string -> ObjectId on update
          (update as any).client = rawClientId;
          const name = await resolveClientName(rawClientId);
          if (name !== null) update.clientName = name;
        } else {
          (update as any).client = undefined as unknown as IOrder["client"];
          update.clientName = "";
        }
      }

      // Overwrite arrays ONLY if provided
      if (Array.isArray(DeliveryAddress)) update.DeliveryAddress = DeliveryAddress as IOrder["DeliveryAddress"];
      if (Array.isArray(pickupMagasin)) update.pickupMagasin = pickupMagasin as IOrder["pickupMagasin"];
      if (Array.isArray(orderItems)) update.orderItems = orderItems as IOrder["orderItems"];
      if (Array.isArray(paymentMethod)) update.paymentMethod = paymentMethod as IOrder["paymentMethod"];
      if (Array.isArray(deliveryMethod)) update.deliveryMethod = deliveryMethod as IOrder["deliveryMethod"];

      const updated = await Order.findByIdAndUpdate(orderId, update, {
        new: true,
        runValidators: true,
      })
        .populate("client")
        .populate("DeliveryAddress.AddressID")
        .populate("pickupMagasin.MagasinID")
        .populate("paymentMethod.PaymentMethodID")
        .populate("deliveryMethod.deliveryMethodID");

      if (!updated) {
        res.status(404).json({ message: "Commande introuvable ou déjà supprimée." });
        return;
      }

      // 🔄 Sync existing facture (if any and not cancelled)
      let factureSync:
        | { action: "updated"; factureId: string }
        | { action: "skipped"; reason: string } = { action: "skipped", reason: "none" };

      try {
        const facture = await Facture.findOne({ order: updated._id });
        if (!facture) {
          factureSync = { action: "skipped", reason: "FACTURE_NOT_FOUND" };
        } else if (facture.status === "Cancelled") {
          factureSync = { action: "skipped", reason: "FACTURE_CANCELLED" };
        } else {
          const { set, items } = projectOrderToFactureUpdate(updated as IOrder);
          facture.set(set);
          facture.set("items", items);
          facture.markModified("items");
          await facture.save();
          factureSync = { action: "updated", factureId: facture.id };
        }
      } catch (e) {
        console.error("[updateOrder] facture sync failed ▶", (e as Error).message);
        factureSync = { action: "skipped", reason: "SYNC_FAILED" };
      }

      res.json({ order: updated, factureSync });
    } catch (err) {
      console.error("Update Order Error:", err);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  }
);

export default router;
