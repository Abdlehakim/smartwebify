/* ------------------------------------------------------------------
   models/Order.ts
------------------------------------------------------------------ */
import mongoose, { Schema, Document, Model, Types } from "mongoose";
import crypto from "crypto";
import { IClient } from "./Client";
import { IClientShop } from "./ClientShop";
import { IClientCompany } from "./ClientCompany";

// type-only import to avoid runtime circular deps
import type { IFacture } from "./Facture";

/* ---------- status union ---------- */
export type OrderStatus =
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Refunded"
  | "Pickup";

/* ---------- sub-doc interfaces ---------- */
export interface IOrderItemAttribute {
  attribute: Types.ObjectId;
  name: string;
  value: string;
}
export interface IOrderItem {
  product: Types.ObjectId;
  reference: string;
  name: string;
  tva: number;
  quantity: number;
  mainImageUrl?: string;
  discount: number;
  price: number;
  attributes?: IOrderItemAttribute[];
}
export interface IDeliveryAddress {
  AddressID: Types.ObjectId;
  DeliverToAddress: string;
}
export interface IPickupMagasin {
  MagasinID: Types.ObjectId;
  MagasinName: string;
  MagasinAddress: string;
}
export interface IPaymentMethod {
  PaymentMethodID: Types.ObjectId;
  PaymentMethodLabel: string;
}
export interface IDeliveryMethod {
  deliveryMethodID: Types.ObjectId;
  deliveryMethodName: string;
  Cost: string;
  expectedDeliveryDate?: Date;
}

/* ---------- main doc interface ---------- */
export interface IOrder extends Document {
  ref?: string;

  client: Types.ObjectId | IClient | IClientShop | IClientCompany;
  clientName: string;

  DeliveryAddress: IDeliveryAddress[];
  pickupMagasin: IPickupMagasin[];
  paymentMethod: IPaymentMethod[];
  orderItems: IOrderItem[];
  deliveryMethod: IDeliveryMethod[];

  orderStatus: OrderStatus;

  /** TRUE once a facture has been created for this order */
  Invoice: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

/* ---------- sub-schemas ---------- */
const DeliveryAddressSchema = new Schema<IDeliveryAddress>(
  {
    AddressID: { type: Schema.Types.ObjectId, ref: "Address", required: true },
    DeliverToAddress: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const PickupMagasinSchema = new Schema<IPickupMagasin>(
  {
    MagasinID: { type: Schema.Types.ObjectId, ref: "Magasin", required: true },
    MagasinAddress: { type: String, trim: true, required: true },
    MagasinName: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const PaymentMethodSchema = new Schema<IPaymentMethod>(
  {
    PaymentMethodID: {
      type: Schema.Types.ObjectId,
      ref: "PaymentMethod",
      required: true,
    },
    PaymentMethodLabel: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const OrderItemAttributeSchema = new Schema<IOrderItemAttribute>(
  {
    attribute: { type: Schema.Types.ObjectId, ref: "Attribute", required: true },
    name: { type: String, trim: true, required: true },
    value: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    reference: { type: String, trim: true, required: true },
    name: { type: String, trim: true, required: true },
    tva: { type: Number, default: 0, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    mainImageUrl: { type: String, default: "" },
    discount: { type: Number, default: 0, min: 0 },
    price: { type: Number, required: true, min: 0 },
    attributes: { type: [OrderItemAttributeSchema], default: [] },
  },
  { _id: false }
);

const DeliveryMethodSchema = new Schema<IDeliveryMethod>(
  {
    deliveryMethodID: {
      type: Schema.Types.ObjectId,
      ref: "DeliveryOption",
      required: true,
    },
    deliveryMethodName: { type: String, trim: true, required: true },
    Cost: { type: String, trim: true, required: true },
    expectedDeliveryDate: { type: Date },
  },
  { _id: false }
);

/* ---------- main schema ---------- */
const OrderSchema = new Schema<IOrder>(
  {
    client: { type: Schema.Types.ObjectId, required: true },
    clientName: { type: String, required: true, trim: true },

    ref: { type: String },

    DeliveryAddress: { type: [DeliveryAddressSchema], default: [] },
    pickupMagasin: { type: [PickupMagasinSchema], default: [] },
    paymentMethod: { type: [PaymentMethodSchema], default: [] },
    orderItems: { type: [OrderItemSchema], required: true, default: [] },
    deliveryMethod: { type: [DeliveryMethodSchema], default: [] },

    orderStatus: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered", "Cancelled", "Refunded", "Pickup"],
      default: "Processing",
    },

    // NEW: persisted flag for invoice existence
    Invoice: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

/* ---------- indexes ---------- */
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ ref: 1 });

/* ---------- hooks ---------- */
OrderSchema.pre<IOrder>("save", function (next) {
  if (!this.ref) this.ref = `ORDER-${crypto.randomBytes(4).toString("hex")}`;
  next();
});

/* ---------- 🔄 FACTURE SYNC (only when Invoice === true) ---------- */

/** Utility: normalize incoming IDs to ObjectId (or undefined). */
function toObjectId(val: any): Types.ObjectId | undefined {
  if (!val) return undefined;
  if (val instanceof Types.ObjectId) return val;
  if (typeof val === "string" && mongoose.Types.ObjectId.isValid(val))
    return new Types.ObjectId(val);
  if (val._id) return new Types.ObjectId(String(val._id));
  return undefined;
}

/** Build the patch for the linked facture from a given order. */
function buildFacturePatch(order: IOrder): {
  set: Partial<IFacture>;
  items: IFacture["items"];
} {
  const addr = Array.isArray(order.DeliveryAddress) ? order.DeliveryAddress[0] : undefined;
  const mag  = Array.isArray(order.pickupMagasin)   ? order.pickupMagasin[0]   : undefined;
  const pay  = Array.isArray(order.paymentMethod)   ? order.paymentMethod[0]   : undefined;
  const del  = Array.isArray(order.deliveryMethod)  ? order.deliveryMethod[0]  : undefined;

  const deliveryAddress = addr
    ? {
        AddressID: toObjectId(addr.AddressID)!,
        DeliverToAddress: addr.DeliverToAddress ?? "",
      }
    : undefined;

  const pickupMagasin = mag
    ? {
        MagasinID: toObjectId(mag.MagasinID)!,
        MagasinAddress: mag.MagasinAddress ?? "",
        MagasinName: mag.MagasinName ?? undefined,
      }
    : undefined;

  const paymentMethod = pay
    ? {
        PaymentMethodID: toObjectId(pay.PaymentMethodID)!,
        PaymentMethodLabel: pay.PaymentMethodLabel ?? "",
      }
    : undefined;

  const deliveryMethod = del
    ? {
        deliveryMethodID: toObjectId(del.deliveryMethodID)!,
        deliveryMethodName: del.deliveryMethodName ?? undefined,
        Cost: del.Cost ?? "0",
        expectedDeliveryDate: del.expectedDeliveryDate ? new Date(del.expectedDeliveryDate) : undefined,
      }
    : undefined;

  const items = (order.orderItems ?? []).map((it) => ({
    product: toObjectId(it.product)!,
    reference: it.reference ?? "",
    name: it.name ?? "",
    tva: Number(it.tva ?? 0),
    quantity: Number(it.quantity ?? 1),
    discount: Number(it.discount ?? 0),
    price: Number(it.price ?? 0),
    attributes: (it.attributes ?? []).map((a) => ({
      attribute: toObjectId(a.attribute)!,
      name: a.name ?? "",
      value: a.value ?? "",
    })),
  })) as IFacture["items"];

  // totals
  const shippingCost = (() => {
    const num = parseFloat(String(deliveryMethod?.Cost ?? "0").replace(",", "."));
    return Number.isFinite(num) ? num : 0;
  })();
  let subtotalHT = 0;
  let tvaTotal = 0;
  for (const li of items) {
    const unitNet = Math.max(0, li.price - (li.discount ?? 0)); // adjust if discount is %
    const lineNet = unitNet * li.quantity;
    const lineTVA = (lineNet * (li.tva ?? 0)) / 100;
    subtotalHT += lineNet;
    tvaTotal += lineTVA;
  }
  const grandTotalTTC = subtotalHT + tvaTotal + shippingCost;

  const set: Partial<IFacture> = {
    orderRef: order.ref ?? undefined,
    client: toObjectId(order.client)!,
    clientName: order.clientName ?? "",
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

/** Apply the patch to the facture if it exists and is not Cancelled. */
async function syncFactureFromOrder(order: IOrder) {
  if (!order.Invoice) return; // only when invoice exists
  try {
    const FactureModel = (mongoose.models.Facture ??
      mongoose.model<IFacture>("Facture")) as mongoose.Model<IFacture>;

    const facture = await FactureModel.findOne({ order: order._id });
    if (!facture) return; // nothing to sync yet
    if (facture.status === "Cancelled") return;

    const { set, items } = buildFacturePatch(order);
    facture.set(set);
    facture.set("items", items);
    facture.markModified("items");
    await facture.save();
  } catch (err) {
    console.error("[Order Model] Failed to sync facture from order:", (err as Error).message);
  }
}

/** After .save() (create/edit via doc.save()) */
OrderSchema.post("save", async function (doc: IOrder) {
  await syncFactureFromOrder(doc);
});

/** After findOneAndUpdate (e.g., findByIdAndUpdate with {new:true}) */
OrderSchema.post("findOneAndUpdate", async function (doc: IOrder) {
  if (!doc) return;
  await syncFactureFromOrder(doc);
});

/* ---------- model ---------- */
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
