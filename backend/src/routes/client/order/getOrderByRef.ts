import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { authenticateToken } from "@/middleware/authenticateToken";
import Order from "@/models/Order";

const router = express.Router();

type DeliveryMethodItem = {
  deliveryMethodID: mongoose.Types.ObjectId;
  deliveryMethodName?: string;
  Cost: string | number;
  expectedDeliveryDate?: Date;
};

type PaymentMethodItem = {
  PaymentMethodID: mongoose.Types.ObjectId;
  PaymentMethodLabel: string;
};

type OrderLean = {
  _id: mongoose.Types.ObjectId;
  ref?: string;
  client: mongoose.Types.ObjectId;
  clientName: string;
  DeliveryAddress: Array<{
    AddressID: mongoose.Types.ObjectId;
    DeliverToAddress: string;
  }>;
  pickupMagasin: Array<{
    MagasinID: mongoose.Types.ObjectId;
    MagasinAddress: string;
    MagasinName?: string;
  }>;
  paymentMethod: PaymentMethodItem[];
  orderItems: Array<{
    product: mongoose.Types.ObjectId;
    reference: string;
    name: string;
    tva: number;
    quantity: number;
    mainImageUrl?: string;
    discount: number;
    price: number;
  }>;
  deliveryMethod: DeliveryMethodItem[];
  orderStatus?: string;
  createdAt: Date;
};

function toNumber(val: string | number | undefined): number {
  if (typeof val === "number") return Number.isFinite(val) ? val : 0;
  if (typeof val === "string") {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

router.get(
  "/getOrderByRef/:ref",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized: User not found." });
        return;
      }

      const { ref } = req.params;
      if (!ref) {
        res
          .status(400)
          .json({ error: "Order reference is required in the URL." });
        return;
      }

      const order = (await Order.findOne({ ref })
        .select(
          "_id ref client clientName DeliveryAddress pickupMagasin paymentMethod orderItems deliveryMethod orderStatus createdAt"
        )
        .lean()) as OrderLean | null;

      if (!order) {
        res.status(404).json({ error: `No order found with ref '${ref}'` });
        return;
      }

      if (String(order.client) !== String(userId)) {
        res
          .status(403)
          .json({ error: "You do not have permission to view this order." });
        return;
      }

      const dmArray = Array.isArray(order.deliveryMethod)
        ? order.deliveryMethod
        : [];

      const deliveryCostLegacy = dmArray.reduce(
        (sum, d) => sum + toNumber(d.Cost),
        0
      );

      const expectedDeliveryDate =
        dmArray.find((d) => !!d.expectedDeliveryDate)?.expectedDeliveryDate ||
        undefined;

      const deliveryMethodLegacy = dmArray
        .map((d) => d.deliveryMethodName)
        .filter(Boolean)
        .join(", ");

      const paymentMethodLegacy = (order.paymentMethod || [])
        .map((p) => p.PaymentMethodLabel)
        .filter(Boolean)
        .join(", ");

      res.status(200).json({
        ...order,
        deliveryCostLegacy,
        expectedDeliveryDate,
        deliveryMethodLegacy,
        paymentMethodLegacy,
      });
    } catch (error) {
      console.error("Error retrieving order:", error);
      res.status(500).json({
        error: "Server error. Unable to retrieve the order at this time.",
      });
    }
  }
);

export default router;
