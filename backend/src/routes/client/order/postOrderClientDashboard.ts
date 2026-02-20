/* ------------------------------------------------------------------
   src/routes/client/order/postOrderClient.ts
------------------------------------------------------------------ */
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { authenticateToken } from "@/middleware/authenticateToken";
import Order from "@/models/Order";
import Client from "@/models/Client";

const router = express.Router();

type ReqDeliveryAddress = { Address: string; DeliverToAddress: string };
type ReqPickupStore =
  | string
  | { id?: string; name?: string; address?: string }
  | null
  | undefined;

router.post(
  "/postOrderClient",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      /* 1) Auth */
      const userId = (req as any).user?.id as string | undefined;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized: User not found." });
        return;
      }

      /* 2) Body */
      const {
        DeliveryAddress,              
        pickupStore,  
        paymentMethod,                
        paymentMethodId,              
        selectedMethod,                
        deliveryCost,                  
        items,                        
      }: {
        DeliveryAddress?: ReqDeliveryAddress[];
        pickupStore?: ReqPickupStore;
        paymentMethod?: string;
        paymentMethodId?: string;
        selectedMethod?: string;
        deliveryCost?: number;
        items?: any[];
      } = req.body || {};

      if (!selectedMethod || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ error: "Missing selectedMethod or items." });
        return;
      }

      const hasDelivery =
        Array.isArray(DeliveryAddress) && DeliveryAddress.length > 0;
      const hasPickup = Boolean(pickupStore);

      if (!hasDelivery && !hasPickup) {
        res
          .status(400)
          .json({ error: "Provide either DeliveryAddress or pickupStore." });
        return;
      }

      /* 4) Client exists? */
      const foundUser = await Client.findById(userId).exec();
      if (!foundUser) {
        res
          .status(404)
          .json({ error: "No matching user found for the provided token." });
        return;
      }

      // Make a friendly clientName (fallbacks)
      const clientName =
        (foundUser as any).fullName ||
        (foundUser as any).name ||
        (foundUser as any).username ||
        (foundUser as any).companyName ||
        (foundUser as any).email ||
        "Client";

      /* 5) Map orderItems (tolerant) */
      const orderItems = items.map((item: any) => ({
        product: item._id,
        reference: item.reference ?? "",
        name: item.name,
        quantity: Number(item.quantity ?? 1),
        tva: Number(item.tva ?? 0),
        mainImageUrl: item.mainImageUrl ?? "",
        discount: Number(item.discount ?? 0),
        price: Number(item.price ?? 0),
      }));

      const deliveryAddressDoc = hasDelivery
        ? DeliveryAddress!.map((d) => ({
            AddressID: new mongoose.Types.ObjectId(d.Address),
            DeliverToAddress: d.DeliverToAddress ?? "",
          }))
        : [];

      let pickupMagasinDoc: { MagasinID: mongoose.Types.ObjectId; MagasinAddress: string }[] = [];
      if (hasPickup) {
        if (typeof pickupStore === "string") {
          pickupMagasinDoc = [
            {
              MagasinID: new mongoose.Types.ObjectId(pickupStore),
              MagasinAddress: "",
            },
          ];
        } else if (pickupStore && typeof pickupStore === "object") {
          const id = pickupStore.id || "";
          pickupMagasinDoc = [
            {
              MagasinID: new mongoose.Types.ObjectId(id),
              MagasinAddress: pickupStore.address || "",
            },
          ];
        }
      }

      const paymentMethodArray = [
        {
          PaymentMethodID: new mongoose.Types.ObjectId(
            paymentMethodId
          ),
          PaymentMethodLabel: paymentMethod,
        },
      ];

      /* 8) Build order doc */
      const newOrder = new Order({
        client: userId,
        clientName,
        DeliveryAddress: deliveryAddressDoc,    
        pickupMagasin: pickupMagasinDoc,         
        paymentMethod: paymentMethodArray,       
        orderItems,
        deliveryMethod: selectedMethod,         
        deliveryCost: Number(deliveryCost ?? 0),
      });

      const savedOrder = await newOrder.save();

      res.status(200).json({ message: "Order created", ref: savedOrder.ref });
    } catch (error) {
      console.error("Error creating order:", error);
      res
        .status(500)
        .json({ error: "Server error. Unable to create the order at this time." });
    }
  }
);

export default router;
