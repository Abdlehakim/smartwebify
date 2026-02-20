/* ------------------------------------------------------------------
   src/routes/dashboardadmin/factures/createFcFromOrder.ts
   POST /api/dashboardadmin/factures/from-order/:orderId
   Creates a facture snapshot from an existing Order.
------------------------------------------------------------------ */
import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import Order, { IOrder } from "@/models/Order";
import Facture, {
  IFacture,
  IFactureItem,
  IFactureItemAttribute,
  IFactureDeliveryAddress,
  IFacturePickupMagasin,
  IFacturePaymentMethod,
  IFactureDeliveryMethod,
} from "@/models/Facture";

import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------ helpers ------------------------------ */

function parseNumberSafe(x: unknown): number {
  if (typeof x === "number") return isFinite(x) ? x : 0;
  if (typeof x === "string") {
    // Accept "12", "12.50", "12,50", "  12  ", etc.
    const cleaned = x.replace(",", ".").replace(/[^\d.]/g, "").trim();
    const n = Number(cleaned);
    return isFinite(n) ? n : 0;
  }
  return 0;
}

function toFactureItemAttributes(
  attrs?: IOrder["orderItems"][number]["attributes"]
): IFactureItemAttribute[] | undefined {
  if (!attrs || attrs.length === 0) return undefined;
  return attrs.map((a) => ({
    attribute: a.attribute,
    name: a.name,
    value: a.value,
  }));
}

function toFactureItems(order: IOrder): IFactureItem[] {
  return order.orderItems.map((it) => ({
    product: it.product,
    reference: it.reference,
    name: it.name,
    tva: it.tva ?? 0,
    quantity: it.quantity,
    discount: it.discount ?? 0,
    price: it.price,
    attributes: toFactureItemAttributes(it.attributes),
  }));
}

function pickSnapshots(order: IOrder): {
  deliveryAddress?: IFactureDeliveryAddress;
  pickupMagasin?: IFacturePickupMagasin;
  paymentMethod?: IFacturePaymentMethod;
  deliveryMethod?: IFactureDeliveryMethod;
  shippingCostNumber: number;
} {
  const addr = order.DeliveryAddress?.[0]
    ? {
        AddressID: order.DeliveryAddress[0].AddressID,
        DeliverToAddress: order.DeliveryAddress[0].DeliverToAddress,
      }
    : undefined;

  const pick = order.pickupMagasin?.[0]
    ? {
        MagasinID: order.pickupMagasin[0].MagasinID,
        MagasinAddress: order.pickupMagasin[0].MagasinAddress,
        MagasinName: order.pickupMagasin[0].MagasinName,
      }
    : undefined;

  const pm = order.paymentMethod?.[0]
    ? {
      PaymentMethodID: order.paymentMethod[0].PaymentMethodID,
      PaymentMethodLabel: order.paymentMethod[0].PaymentMethodLabel,
    }
    : undefined;

  const dmRaw = order.deliveryMethod?.[0];
  const dm = dmRaw
    ? {
        deliveryMethodID: dmRaw.deliveryMethodID,
        deliveryMethodName: dmRaw.deliveryMethodName,
        Cost: dmRaw.Cost,
        expectedDeliveryDate: dmRaw.expectedDeliveryDate,
      }
    : undefined;

  const shippingCostNumber = parseNumberSafe(dmRaw?.Cost ?? 0);

  return { deliveryAddress: addr, pickupMagasin: pick, paymentMethod: pm, deliveryMethod: dm, shippingCostNumber };
}

function computeTotals(items: IFactureItem[], shippingCost: number) {
  // Assumptions:
  // - price = unit price HT (before TVA)
  // - discount = per-unit discount HT
  // - tva = percent (e.g., 19 for 19%)
  let subtotalHT = 0;
  let tvaTotal = 0;

  for (const it of items) {
    const unitNet = Math.max(0, (it.price ?? 0) - (it.discount ?? 0));
    const lineHT = unitNet * (it.quantity ?? 0);
    const lineTVA = lineHT * ((it.tva ?? 0) / 100);
    subtotalHT += lineHT;
    tvaTotal += lineTVA;
  }

  const grandTotalTTC = subtotalHT + tvaTotal + (shippingCost ?? 0);
  return {
    subtotalHT: roundMoney(subtotalHT),
    tvaTotal: roundMoney(tvaTotal),
    shippingCost: roundMoney(shippingCost ?? 0),
    grandTotalTTC: roundMoney(grandTotalTTC),
  };
}

function roundMoney(n: number) {
  // Keep two decimals; adapt if you prefer three.
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/* ------------------------------- route -------------------------------- */

/**
 * Create a facture from an order.
 * Only allowed for eligible orders (default: Delivered or Pickup).
 *
 * Returns: { facture }
 */
router.post(
  "/from-order/:orderId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      res.status(400).json({ message: "Invalid order ID." });
      return;
    }

    try {
      // Load the order snapshot
      const order = await Order.findById(orderId).lean<IOrder>();
      if (!order) {
        res.status(404).json({ message: "Order not found." });
        return;
      }

      // Do not create twice
      const existing = await Facture.findOne({ order: order._id }).lean<IFacture>();
      if (existing) {
        res.status(200).json({ facture: existing, message: "Facture already exists for this order." });
        return;
      }

      // Eligibility gate: default allow when Delivered or Pickup (picked up).
      if (!(order.orderStatus === "Delivered" || order.orderStatus === "Pickup")) {
        res.status(400).json({
          message:
            "Cette commande n'est pas éligible pour la facture. La facture est disponible une fois la commande livrée (ou récupérée).",
        });
        return;
      }

      // Build facture payload
      const items = toFactureItems(order);
      if (!items.length) {
        res.status(400).json({ message: "Order has no items to invoice." });
        return;
      }

      const {
        deliveryAddress,
        pickupMagasin,
        paymentMethod,
        deliveryMethod,
        shippingCostNumber,
      } = pickSnapshots(order);

      const totals = computeTotals(items, shippingCostNumber);

      const facture: Partial<IFacture> = {
        // numbering (ref/seq/year) will be set by pre-validate hook
        order: order._id as any,
        orderRef: order.ref,
        client: order.client as any,
        clientName: order.clientName,

        deliveryAddress,
        pickupMagasin,
        paymentMethod,
        deliveryMethod,

        items,

        currency: "TND", // change if you support multi-currency
        subtotalHT: totals.subtotalHT,
        tvaTotal: totals.tvaTotal,
        shippingCost: totals.shippingCost,
        grandTotalTTC: totals.grandTotalTTC,

        // status defaults to "Paid" in schema; issuedAt defaults to now
      };

      const created = await Facture.create(facture);

      // Post-save hook on Facture will set Order.Invoice=true
      res.status(201).json({ facture: created });
    } catch (err: any) {
      // Handle duplicate key (race) gracefully
      if (err?.code === 11000) {
        try {
          const dupe = await Facture.findOne({ order: orderId }).lean<IFacture>();
          if (dupe) {
            res.status(200).json({ facture: dupe, message: "Facture already exists (deduplicated)." });
            return;
          }
        } catch {
          // fall through to generic error
        }
      }

      console.error("[createFcFromOrder] error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
