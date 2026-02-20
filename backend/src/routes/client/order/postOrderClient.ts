/* ------------------------------------------------------------------
   src/routes/client/order/postOrderClient.ts
------------------------------------------------------------------ */
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { authenticateToken } from "@/middleware/authenticateToken";
import Order from "@/models/Order";
import Client from "@/models/Client";
import PaymentMethod from "@/models/payment/PaymentMethods";
import DeliveryOption from "@/models/dashboardadmin/DeliveryOption";

const router = express.Router();

type ReqDeliveryAddressItem = {
  AddressID?: string;
  Address?: string;
  DeliverToAddress?: string;
};

type ReqPickupMagasinItem = {
  MagasinID?: string;
  MagasinAddress?: string;
  MagasinName?: string;
};

type ReqPickupStore =
  | string
  | { id?: string; name?: string; address?: string }
  | null
  | undefined;

type ReqDeliveryMethodItem = {
  deliveryMethodID?: string;
  deliveryMethodName?: string;
  Cost?: string | number;
  expectedDeliveryDate?: string | Date;
};

type ReqItemAttribute = {
  attribute?: string;
  name?: string;
  value?: string;
};

type ReqItem = {
  _id?: string;
  reference?: string;
  name?: string;
  quantity?: number;
  tva?: number;
  mainImageUrl?: string;
  discount?: number;
  price?: number;
  attributes?: ReqItemAttribute[];
};

interface BodyPayload {
  DeliveryAddress?: ReqDeliveryAddressItem[];
  pickupMagasin?: ReqPickupMagasinItem[];
  pickupStore?: ReqPickupStore;
  paymentMethod?: string;
  paymentMethodId?: string;
  deliveryMethod?: ReqDeliveryMethodItem[];
  items?: ReqItem[];
}

function isValidObjectId(id?: string): id is string {
  return !!id && mongoose.isValidObjectId(id);
}

interface AuthenticatedRequest extends Request {
  user?: { id?: string };
}

router.post(
  "/postOrderClient",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { user } = (req as unknown as AuthenticatedRequest) || {};
      const userId = user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized: User not found." });
        return;
      }

      const {
        DeliveryAddress,
        pickupMagasin,
        pickupStore,
        paymentMethod,
        paymentMethodId,
        deliveryMethod,
        items,
      } = (req.body as BodyPayload) || {};

      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "Missing items." });
        return;
      }

      const hasDelivery =
        Array.isArray(DeliveryAddress) &&
        DeliveryAddress.some((d) => !!(d?.AddressID || d?.Address));

      const hasPickupMagasinArray =
        Array.isArray(pickupMagasin) &&
        pickupMagasin.length > 0 &&
        pickupMagasin.some((p) => !!p?.MagasinID);

      const hasPickupStore = !!pickupStore;

      if (!hasDelivery && !hasPickupMagasinArray && !hasPickupStore) {
        res.status(400).json({
          error:
            "Provide a DeliveryAddress array or a pickupMagasin array or pickupStore.",
        });
        return;
      }

      if (!Array.isArray(deliveryMethod) || deliveryMethod.length === 0) {
        res.status(400).json({ error: "deliveryMethod array is required." });
        return;
      }

      const foundUser = await Client.findById(userId).exec();
      if (!foundUser) {
        res
          .status(404)
          .json({ error: "No matching user found for the provided token." });
        return;
      }
      const fu = foundUser as unknown as {
        fullName?: string;
        name?: string;
        username?: string;
        companyName?: string;
        email?: string;
      };
      const clientName =
        fu.fullName ??
        fu.name ??
        fu.username ??
        fu.companyName ??
        fu.email ??
        "Client";

      const orderItems = items.map((item) => {
        const productId = item?._id;
        const attrs: {
          attribute: mongoose.Types.ObjectId;
          name: string;
          value: string;
        }[] = [];

        if (Array.isArray(item.attributes)) {
          for (const a of item.attributes) {
            const id = a?.attribute;
            const nm = (a?.name || "").trim();
            const val = (a?.value || "").trim();
            if (!isValidObjectId(id) || !nm || !val) continue;
            attrs.push({
              attribute: new mongoose.Types.ObjectId(id),
              name: nm,
              value: val,
            });
          }
        }

        return {
          product: isValidObjectId(productId)
            ? new mongoose.Types.ObjectId(productId)
            : undefined,
          reference: String(item.reference ?? ""),
          name: String(item.name ?? ""),
          quantity: Number(item.quantity ?? 1),
          tva: Number(item.tva ?? 0),
          mainImageUrl: String(item.mainImageUrl ?? ""),
          discount: Number(item.discount ?? 0),
          price: Number(item.price ?? 0),
          attributes: attrs,
        };
      });

      if (orderItems.some((oi) => !oi.product)) {
        res.status(400).json({ error: "Invalid product id in items." });
        return;
      }

      const deliveryAddressDoc: {
        AddressID: mongoose.Types.ObjectId;
        DeliverToAddress: string;
      }[] = [];
      if (hasDelivery && Array.isArray(DeliveryAddress)) {
        for (const d of DeliveryAddress) {
          const rawId = d?.AddressID || d?.Address;
          const deliverTo = (d?.DeliverToAddress || "").trim();
          if (!isValidObjectId(rawId)) continue;
          if (!deliverTo) {
            res.status(400).json({
              error: "DeliverToAddress is required for DeliveryAddress.",
            });
            return;
          }
          deliveryAddressDoc.push({
            AddressID: new mongoose.Types.ObjectId(rawId),
            DeliverToAddress: deliverTo,
          });
        }
      }

      const pickupMagasinDoc: {
        MagasinID: mongoose.Types.ObjectId;
        MagasinAddress: string;
        MagasinName: string;
      }[] = [];
      if (hasPickupMagasinArray && Array.isArray(pickupMagasin)) {
        for (const p of pickupMagasin) {
          const rawId = p?.MagasinID;
          const addr = (p?.MagasinAddress || "").trim();
          const name = (p?.MagasinName || "").trim();
          if (!isValidObjectId(rawId)) continue;
          if (!addr) {
            res.status(400).json({
              error: "MagasinAddress is required for pickupMagasin.",
            });
            return;
          }
          pickupMagasinDoc.push({
            MagasinID: new mongoose.Types.ObjectId(rawId),
            MagasinAddress: addr,
            MagasinName: name || "",
          });
        }
      }

      if (!pickupMagasinDoc.length && hasPickupStore) {
        if (typeof pickupStore === "string") {
          if (!isValidObjectId(pickupStore)) {
            res.status(400).json({
              error:
                "pickupStore must be a valid ObjectId or object with id.",
            });
            return;
          }
          res.status(400).json({
            error:
              "MagasinAddress is required for pickup. Send pickupMagasin[{ MagasinID, MagasinAddress, MagasinName }] or pickupStore as { id, address, name }.",
          });
          return;
        } else if (pickupStore && typeof pickupStore === "object") {
          const rawId = pickupStore.id;
          const addr = (pickupStore.address || "").trim();
          const name = (pickupStore.name || "").trim();
          if (!isValidObjectId(rawId)) {
            res
              .status(400)
              .json({ error: "pickupStore.id must be a valid ObjectId." });
            return;
          }
          if (!addr) {
            res
              .status(400)
              .json({ error: "pickupStore.address is required for pickup." });
            return;
          }
          pickupMagasinDoc.push({
            MagasinID: new mongoose.Types.ObjectId(rawId),
            MagasinAddress: addr,
            MagasinName: name || "",
          });
        }
      }

      if (!deliveryAddressDoc.length && !pickupMagasinDoc.length) {
        res.status(400).json({
          error:
            "No valid DeliveryAddress or pickupMagasin provided. Check required fields (AddressID/DeliverToAddress or MagasinID/MagasinAddress).",
        });
        return;
      }

      const ids = (deliveryMethod as ReqDeliveryMethodItem[])
        .map((dm) => dm?.deliveryMethodID)
        .filter((id): id is string => isValidObjectId(id));

      const options = ids.length
        ? await DeliveryOption.find({ _id: { $in: ids } })
            .select("_id name price estimatedDays")
            .lean()
        : [];

      const optMap = new Map<
        string,
        { name?: string; price?: number; estimatedDays?: number }
      >();
      for (const o of options) {
        optMap.set(String(o._id), {
          name: o.name,
          price: o.price,
          estimatedDays: o.estimatedDays,
        });
      }

      const deliveryMethodDoc: {
        deliveryMethodID: mongoose.Types.ObjectId;
        deliveryMethodName: string;
        Cost: string;
        expectedDeliveryDate?: Date;
      }[] = [];

      for (const dm of deliveryMethod as ReqDeliveryMethodItem[]) {
        const id = dm?.deliveryMethodID;
        if (!isValidObjectId(id)) continue;

        const opt = optMap.get(id);

        const nameFromReq = (dm?.deliveryMethodName ?? "").toString().trim();
        const finalName = nameFromReq || opt?.name || "Standard";

        const costVal = dm?.Cost;
        const finalCost =
          typeof costVal === "number"
            ? costVal.toFixed(2)
            : typeof costVal === "string" && costVal.trim() !== ""
            ? costVal
            : typeof opt?.price === "number"
            ? opt.price.toFixed(2)
            : "0.00";

        let expected: Date | undefined;
        if (dm?.expectedDeliveryDate) {
          const d = new Date(dm.expectedDeliveryDate as Date);
          if (!isNaN(d.getTime())) expected = d;
        } else if (typeof opt?.estimatedDays === "number") {
          const d = new Date();
          d.setDate(d.getDate() + opt.estimatedDays);
          expected = d;
        }

        deliveryMethodDoc.push({
          deliveryMethodID: new mongoose.Types.ObjectId(id),
          deliveryMethodName: finalName,
          Cost: finalCost,
          ...(expected ? { expectedDeliveryDate: expected } : {}),
        });
      }

      if (!deliveryMethodDoc.length) {
        res.status(400).json({
          error:
            "deliveryMethod must include at least one valid entry with deliveryMethodID.",
        });
        return;
      }

      type PaymentMethodLean = {
        _id: mongoose.Types.ObjectId;
        label?: string;
        name?: string;
      };
      let pmDoc: PaymentMethodLean | null = null;

      if (isValidObjectId(paymentMethodId)) {
        pmDoc = await PaymentMethod.findById(paymentMethodId)
          .select("_id label name")
          .lean<PaymentMethodLean>()
          .exec();
      }
      if (!pmDoc && paymentMethod) {
        pmDoc =
          (await PaymentMethod.findOne({ label: paymentMethod })
            .select("_id label name")
            .lean<PaymentMethodLean>()
            .exec()) ||
          (await PaymentMethod.findOne({ name: paymentMethod })
            .select("_id label name")
            .lean<PaymentMethodLean>()
            .exec());
      }
      if (!pmDoc) {
        res.status(400).json({
          error:
            "Payment method not found (provide valid paymentMethodId or a known label/name).",
        });
        return;
      }

      const paymentMethodArray = [
        {
          PaymentMethodID: pmDoc._id,
          PaymentMethodLabel: String(
            paymentMethod ?? pmDoc.label ?? pmDoc.name ?? ""
          ),
        },
      ];

      const newOrder = new Order({
        client: userId,
        clientName,
        DeliveryAddress: deliveryAddressDoc,
        pickupMagasin: pickupMagasinDoc,
        paymentMethod: paymentMethodArray,
        orderItems,
        deliveryMethod: deliveryMethodDoc,
      });

      const savedOrder = await newOrder.save();
      res.status(200).json({ message: "Order created", ref: savedOrder.ref });
    } catch (error) {
      console.error("Error creating order:", error);
      const maybe = error as { name?: string; message?: unknown };
      if (maybe?.name === "ValidationError") {
        res.status(400).json({
          error: String(maybe.message ?? "Validation error"),
        });
        return;
      }
      res.status(500).json({
        error: "Server error. Unable to create the order at this time.",
      });
    }
  }
);

export default router;
