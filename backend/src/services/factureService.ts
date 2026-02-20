// src/services/factureService.ts
import mongoose from "mongoose";
import Order from "@/models/Order";
import Facture from "@/models/Facture";

function parseNumberLike(n?: string | number) {
  if (typeof n === "number") return n;
  if (!n) return 0;
  const x = parseFloat(String(n).replace(",", "."));
  return Number.isFinite(x) ? x : 0;
}

export async function createFactureFromOrder(orderId: string) {
  const order = await Order.findById(orderId).lean();
  if (!order) return { ok: false as const, reason: "ORDER_NOT_FOUND" };
  if (order.orderStatus !== "Delivered")
    return { ok: false as const, reason: "NOT_ELIGIBLE" };

  // idempotency: if already created, exit quietly
  const existing = await Facture.findOne({
    order: new mongoose.Types.ObjectId(orderId),
  }).lean();
  if (existing)
    return { ok: true as const, already: true as const, ref: existing.ref };

  const deliveryAddress = order.DeliveryAddress?.[0]
    ? {
        AddressID: order.DeliveryAddress[0].AddressID,
        DeliverToAddress: order.DeliveryAddress[0].DeliverToAddress,
      }
    : undefined;

  const pickupMagasin = order.pickupMagasin?.[0]
    ? {
        MagasinID: order.pickupMagasin[0].MagasinID,
        MagasinName: order.pickupMagasin[0].MagasinName,
        MagasinAddress: order.pickupMagasin[0].MagasinAddress,
      }
    : undefined;

  const paymentMethod = order.paymentMethod?.[0]
    ? {
        PaymentMethodID: order.paymentMethod[0].PaymentMethodID,
        PaymentMethodLabel: order.paymentMethod[0].PaymentMethodLabel,
      }
    : undefined;

  const deliveryMethod = order.deliveryMethod?.[0]
    ? {
        deliveryMethodID: order.deliveryMethod[0].deliveryMethodID,
        deliveryMethodName: order.deliveryMethod[0].deliveryMethodName,
        Cost: order.deliveryMethod[0].Cost,
        expectedDeliveryDate: order.deliveryMethod[0].expectedDeliveryDate,
      }
    : undefined;

  const items = (order.orderItems ?? []).map((it: any) => ({
    product: it.product,
    reference: it.reference,
    name: it.name,
    tva: it.tva ?? 0,
    quantity: it.quantity,
    discount: it.discount ?? 0,
    price: it.price,
    attributes: (it.attributes ?? []).map((a: any) => ({
      attribute: a.attribute,
      name: a.name,
      value: a.value,
    })),
  }));

  let subtotalHT = 0;
  let tvaTotal = 0;
  for (const it of items) {
    const lineUnit = Math.max((it.price ?? 0) - (it.discount ?? 0), 0);
    const lineHT = lineUnit * (it.quantity ?? 0);
    subtotalHT += lineHT;
    tvaTotal += lineHT * ((it.tva ?? 0) / 100);
  }
  const shippingCost = parseNumberLike(deliveryMethod?.Cost);
  const grandTotalTTC = subtotalHT + tvaTotal + shippingCost;

  try {
    const now = new Date();
    const doc = await Facture.create({
      order: order._id,
      orderRef: order.ref,
      client: order.client,
      clientName: order.clientName,
      deliveryAddress,
      pickupMagasin,
      paymentMethod,
      deliveryMethod,
      items,
      currency: "TND",
      subtotalHT,
      tvaTotal,
      shippingCost,
      grandTotalTTC,
      status: "Paid",      
      issuedAt: now,
      paidAt: now,         
    });
    return { ok: true as const, ref: doc.ref };
  } catch (e: any) {
    // Handle race: unique index on { order: 1 }
    if (e?.code === 11000) return { ok: true as const, already: true as const };
    throw e;
  }
}
