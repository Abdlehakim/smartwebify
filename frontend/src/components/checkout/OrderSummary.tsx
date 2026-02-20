/* ------------------------------------------------------------------
   src/components/checkout/OrderSummary.tsx
------------------------------------------------------------------ */
"use client";

import React, { Key, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { fetchData } from "@/lib/fetchData";
import LoadingDots from "@/components/LoadingDots";
import { useCurrency } from "@/contexts/CurrencyContext";

interface OrderItemAttr {
  attribute: string;
  name: string;
  value: string;
}
interface OrderItem {
  _id?: Key | null;
  product: string;
  reference: string;
  name: string;
  tva: number;
  quantity: number;
  mainImageUrl?: string;
  discount: number;
  price: number;
  attributes?: OrderItemAttr[];
}

interface DeliveryAddressItem {
  AddressID: string;
  DeliverToAddress: string;
}
interface PickupMagasinItem {
  MagasinID: string;
  MagasinAddress: string;
  MagasinName?: string;
}
interface PaymentMethodItem {
  PaymentMethodID: string;
  PaymentMethodLabel: string;
}
interface DeliveryMethodItem {
  deliveryMethodID: string;
  deliveryMethodName?: string;
  Cost: string | number;
  expectedDeliveryDate?: string | Date;
}
interface Order {
  _id: string;
  ref?: string;
  client: string;
  clientName: string;
  DeliveryAddress: DeliveryAddressItem[];
  pickupMagasin: PickupMagasinItem[];
  paymentMethod: PaymentMethodItem[];
  orderItems: OrderItem[];
  deliveryMethod: DeliveryMethodItem[];
  orderStatus?: string;

  paymentMethodLegacy?: string;
  deliveryCostLegacy?: number;
  expectedDeliveryDate?: string | Date;
  deliveryMethodLegacy?: string;
}

const OrderSummary: React.FC<{ data: string }> = ({ data }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { fmt } = useCurrency();

  useEffect(() => {
    (async () => {
      try {
        const fetched = await fetchData<Order>(
          `/client/order/getOrderByRef/${data}`,
          { method: "GET", credentials: "include" }
        );
        setOrder(fetched || null);
      } catch (err) {
        console.error("Error fetching order:", err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [data]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <LoadingDots />
      </div>
    );
  }
  if (!order) return <div>Order data not found.</div>;

  const paymentLabels = order.paymentMethod.map((p) => p.PaymentMethodLabel).filter(Boolean);
  const paymentMethodText =
    paymentLabels.length > 0 ? paymentLabels.join(", ") : order.paymentMethodLegacy || "—";

  const isPickup = order.pickupMagasin.length > 0;
  const deliverToAddress = order.DeliveryAddress[0]?.DeliverToAddress || "";
  const magasinAddress = order.pickupMagasin[0]?.MagasinAddress || "";

  const itemsTotal = order.orderItems.reduce((sum, item) => {
    const unit = item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
    return sum + unit * item.quantity;
  }, 0);

  const dmArray = Array.isArray(order.deliveryMethod) ? order.deliveryMethod : [];
  const deliveryMethodText =
    dmArray.length > 0
      ? dmArray.map((d) => d.deliveryMethodName || "—").filter(Boolean).join(", ")
      : order.deliveryMethodLegacy || "—";

  const deliveryCostFromDM = dmArray.reduce((sum, d) => {
    const v = typeof d.Cost === "number" ? d.Cost : parseFloat(String(d.Cost || 0));
    return sum + (isFinite(v) ? v : 0);
  }, 0);

  const deliveryCost =
    typeof order.deliveryCostLegacy === "number" ? order.deliveryCostLegacy : deliveryCostFromDM;

  const computedTotal = itemsTotal + deliveryCost;

  const expectedFromDM =
    dmArray.find((d) => d.expectedDeliveryDate)?.expectedDeliveryDate ??
    order.expectedDeliveryDate ??
    null;
  const expectedDate = expectedFromDM ? new Date(expectedFromDM).toLocaleDateString() : null;

  // ---- helper to build a unique, stable key for each line item ----
  const makeLineKey = (it: OrderItem, idx: number) => {
    const attrSig = (it.attributes ?? [])
      .map(a => `${a.attribute}:${a.value}`)
      .sort()
      .join("|"); // same attributes = same signature
    const base = it.product || it.reference || "item";
    return `${base}|${attrSig}|${idx}`; // idx only as final disambiguator
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="bg-white shadow-lg rounded-lg p-6 w-[50%] max-md:w-[90%]">
        <div className="flex justify-center mb-6">
          <h2 className="text-3xl max-md:text-lg font-bold text-green-500">
            Merci pour votre commande&nbsp;!
          </h2>
        </div>

        <div className="border-t border-gray-300 pt-4">
          <p className="text-gray-700 max-md:text-xs">
            Votre commande <span className="font-bold">#{order.ref || "—"}</span> a été réussie.
          </p>

          <div className="mt-4">
            <p className="text-base font-bold">
              Total&nbsp;: <span>{fmt(computedTotal)}</span>
            </p>
          </div>

          <div className="mt-6">
            <p className="font-semibold text-lg mb-2">Article(s)&nbsp;:</p>
            <div className="flex flex-col divide-y divide-gray-200">
              {order.orderItems.length > 0 ? (
                order.orderItems.map((item, idx) => {
                  const unit =
                    item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
                  const lineTotal = unit * item.quantity;
                  const attrs = Array.isArray(item.attributes) ? item.attributes : [];
                  return (
                    <div
                      key={makeLineKey(item, idx)}
                      className="py-4 flex max-md:flex-col justify-between items-center"
                    >
                      <div className="flex items-center gap-4">
                        <Image
                          src={item.mainImageUrl || "/placeholder.png"}
                          alt={item.name}
                          width={100}
                          height={100}
                          className="rounded-lg"
                        />
                        <div>
                          <p className="text-lg font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-600">
                            {fmt(unit)}{" "}
                            {item.discount > 0 && (
                              <span className="text-gray-500">
                                (Remisé&nbsp;{item.discount}%)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-500">
                            Quantité&nbsp;: {item.quantity}
                          </p>

                          {attrs.length > 0 && (
                            <div className="mt-1 text-xs text-gray-800 space-y-0.5">
                              {attrs.map((a, aIdx) => (
                                <div key={`${a.attribute}:${a.value}:${aIdx}`}>
                                  <span className="font-semibold">{a.name} :</span>{" "}
                                  <span className="text-gray-700">{a.value}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-lg font-bold">{fmt(lineTotal)}</p>
                    </div>
                  );
                })
              ) : (
                <p>Aucun article trouvé</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2 max-md:text-xs border-t border-gray-300 pt-4">
            <p className="font-bold">
              Client&nbsp;: <span className="font-normal text-gray-700">{order.clientName}</span>
            </p>

            <p className="font-bold">
              Mode(s) de paiement&nbsp;:{" "}
              <span className="font-normal text-gray-700">{paymentMethodText}</span>
            </p>

            <p className="font-bold">
              Méthode(s) de livraison&nbsp;:{" "}
              <span className="font-normal text-gray-700">
                {deliveryMethodText} {isFinite(deliveryCost) && <>({fmt(deliveryCost)})</>}
              </span>
            </p>

            {isPickup ? (
              <p className="font-bold">
                Point de retrait&nbsp;:{" "}
                <span className="font-normal text-gray-700">{magasinAddress || "—"}</span>
              </p>
            ) : (
              <p className="font-bold">
                Adresse de livraison&nbsp;:{" "}
                <span className="font-normal text-gray-700">{deliverToAddress || "—"}</span>
              </p>
            )}

            {!isPickup && expectedDate && (
              <p className="font-bold">
                Date de livraison prévue&nbsp;:{" "}
                <span className="font-normal text-gray-700">{expectedDate}</span>
              </p>
            )}

            {!!order.orderStatus && (
              <p className="font-bold">
                Statut&nbsp;:{" "}
                <span className="font-normal text-gray-700">{order.orderStatus}</span>
              </p>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Un e-mail de confirmation vous a été envoyé. Vous pourrez suivre
            l’avancement de votre commande dans votre espace client.
          </div>
        </div>

        <div className="flex justify-between gap-2 border-t border-gray-300 mt-4 pt-4">
          <button
            onClick={() => router.push("/")}
            className="mt-2 w-full rounded-md border border-gray-300 px-2 py-2 text-sm hover:bg-primary hover:text-white"
          >
            Accueil
          </button>
          <button
            onClick={() => router.push("/orderhistory")}
            className="mt-2 w-full rounded-md border border-gray-300 px-2 py-2 text-sm hover:bg-primary hover:text-white max-md:text-xs"
          >
            Suivre ma commande
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
