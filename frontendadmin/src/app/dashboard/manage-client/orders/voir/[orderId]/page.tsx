/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/voir/[orderId]/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import LoadingDots from "@/components/LoadingDots";
import { generatePdf } from "@/lib/generatePdf";

/* ---------- types (mirror backend model) ---------- */
interface OrderItemAttribute {
  attribute: string;
  name: string;
  value: string;
}

interface OrderItem {
  product: string;
  reference: string;
  name: string;
  quantity: number;
  price: number;     // TTC (unit)
  tva: number;
  discount: number;  // %
  attributes?: OrderItemAttribute[];
}

interface DeliveryAddressRow {
  AddressID: string;
  DeliverToAddress: string;
}

interface PickupMagasinRow {
  MagasinID: string;
  MagasinName?: string;
  MagasinAddress: string;
}

interface PaymentMethodRow {
  PaymentMethodID: string;
  PaymentMethodLabel: string;
}

interface DeliveryMethodRow {
  deliveryMethodID: string;
  deliveryMethodName?: string;
  Cost: string; // stored as string in model
  expectedDeliveryDate?: string;
}

interface Order {
  _id: string;
  ref?: string;
  clientName: string;

  DeliveryAddress: DeliveryAddressRow[];
  pickupMagasin: PickupMagasinRow[];

  paymentMethod: PaymentMethodRow[];
  deliveryMethod: DeliveryMethodRow[];

  orderItems: OrderItem[];

  orderStatus?: string;
  createdAt: string;
}

/* ---------- helpers ---------- */
const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const frFmt = (n: number) => `${n.toFixed(2).replace(".", ",")} TND`;

/** Build a unique, stable key for a row from product + reference + attributes + index */
const rowKey = (it: OrderItem, idx: number) => {
  const attrSig = (it.attributes ?? [])
    .map((a) => `${a.attribute}:${a.value}`)
    .sort()
    .join("|");
  return `${it.product}|${it.reference}|${attrSig}|${idx}`;
};

export default function OrderDetailsPage() {
  const { orderId } = useParams() as { orderId: string };

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  /* download overlay state */
  const [downloading, setDownloading] = useState<false | "bl">(false);
  const [dlSuccess, setDlSuccess] = useState(false);

  /* fetch order */
  useEffect(() => {
    (async () => {
      try {
        const { order } = await fetchFromAPI<{ order: Order }>(
          `/dashboardadmin/orders/${orderId}`
        );
        setOrder(order);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  if (loading)
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <LoadingDots loadingMessage="Chargement de la commande…" />
      </div>
    );

  if (!order) return <div className="p-8">Order not found.</div>;

  /* delivery cost (sum all selected delivery methods) */
  const deliveryCostTotal = (order.deliveryMethod ?? []).reduce(
    (s, r) => s + toNumber(r.Cost),
    0
  );

  /* totals (sum lines + delivery) */
  const totalLinesTTC = order.orderItems.reduce((s, it) => {
    const puRemise = it.price * (1 - it.discount / 100);
    return s + puRemise * it.quantity;
  }, 0);
  const totalTTC = totalLinesTTC + deliveryCostTotal;

  /* livraison vs retrait */
  const pickupList = order.pickupMagasin ?? [];
  const isPickup = pickupList.length > 0;

  const addressLabel =
    order.DeliveryAddress?.map((a) => a.DeliverToAddress).join("\n") || "—";
  const magasinLabel =
    pickupList
      .map((m) =>
        m.MagasinName ? `${m.MagasinName} — ${m.MagasinAddress}` : m.MagasinAddress
      )
      .join("\n") || "—";

  /* labels */
  const paymentLabel =
    order.paymentMethod?.map((p) => p.PaymentMethodLabel).join(", ") || "—";

  const deliveryLabel =
    order.deliveryMethod?.length
      ? order.deliveryMethod
          .map((d) => {
            const cost = frFmt(toNumber(d.Cost));
            const date = d.expectedDeliveryDate
              ? new Date(d.expectedDeliveryDate).toLocaleDateString("fr-FR")
              : "";
            const name = d.deliveryMethodName ?? "—";
            return date ? `${name} – ${cost} · ${date}` : `${name} – ${cost}`;
          })
          .join("\n")
      : "—";

  /* ---------- Status progress (En cours → Expédiée → Livrée) + bullets ---------- */
  const STATUS_LABELS: Record<string, string> = {
    Processing: "En cours",
    Shipped: "Expédiée",
    Delivered: "Livrée",
    Pickup: "Retrait en magasin",
    Cancelled: "Annulée",
    Refunded: "Remboursée",
  };

  const FLOW: Array<keyof typeof STATUS_LABELS> = [
    "Processing",
    "Shipped",
    "Delivered",
  ];

  const statusRaw = order.orderStatus ?? "Processing";
  const isTerminal = statusRaw === "Cancelled" || statusRaw === "Refunded";
  const currentIndexInFlow = FLOW.indexOf(
    statusRaw as keyof typeof STATUS_LABELS
  );
  const safeIndex = currentIndexInFlow === -1 ? 0 : currentIndexInFlow;
  const progressPercent = isTerminal
    ? 0
    : (safeIndex / (FLOW.length - 1)) * 100;

  /* ---------- download handlers ---------- */
  const numberFromRef = String(order.ref ?? order._id).replace(/^ORDER-/, "");

  const withOverlay = async (mode: "bl", action: () => Promise<void>) => {
    try {
      setDownloading(mode);
      setDlSuccess(false);
      await action();
      setDlSuccess(true);
    } catch (e) {
      console.error(e);
      setDlSuccess(true);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDlSuccess(false);
      }, 1200);
    }
  };

  const handleDownloadBL = async () => {
    if (!order?.ref) return;
    await withOverlay("bl", () =>
      generatePdf(`/pdf/invoice/${order.ref}?doc=bl`, `BL-${numberFromRef}.pdf`)
    );
  };

  const overlayMsg = "Génération du bon de livraison…";
  if (downloading)
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots
          loadingMessage={overlayMsg}
          successMessage="Téléchargement démarré"
          isSuccess={dlSuccess}
        />
      </div>
    );

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          Commande {order.ref ?? order._id}
        </h1>

        <Link
          href="/dashboard/manage-client/orders"
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          ← Retour
        </Link>
      </div>

      {/* Status progress & bullets */}
      <div className="p-4">
        <div className="flex items-center justify-between gap-6">
          {/* progress */}
          <div className="flex-1">
            <div className="relative mb-3">
              {/* base line */}
              <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-1 bg-gray-200 rounded" />
              {/* active line */}
              {!isTerminal && (
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-1 bg-secondary rounded"
                  style={{ width: `calc(${progressPercent}% - 0.75rem)` }}
                />
              )}
              {/* dots */}
              <div className="relative flex justify-between">
                {FLOW.map((k, i) => {
                  const active = !isTerminal && i <= safeIndex;
                  return (
                    <div
                      key={k}
                      className={[
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                        active
                          ? "bg-secondary text-white"
                          : "bg-white border border-gray-300 text-gray-600",
                      ].join(" ")}
                      title={STATUS_LABELS[k]}
                    />
                  );
                })}
              </div>
            </div>
            {/* labels under dots */}
            <div className="flex justify-between text-xs text-gray-700">
              {FLOW.map((k) => (
                <span
                  key={k}
                  className={
                    !isTerminal && FLOW.indexOf(k) <= safeIndex
                      ? "font-medium"
                      : ""
                  }
                >
                  {STATUS_LABELS[k]}
                </span>
              ))}
            </div>
          </div>

          {/* divider */}
          <div className="w-px self-stretch bg-gray-200 hidden md:block" />

          {/* bullets */}
          <div className="md:w-56 w-full flex flex-col gap-2">
            <div
              className={[
                "flex items-center gap-2 text-sm",
                statusRaw === "Cancelled"
                  ? "text-red-600 font-medium"
                  : "text-gray-600",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block w-2.5 h-2.5 rounded-full",
                  statusRaw === "Cancelled" ? "bg-red-600" : "bg-gray-300",
                ].join(" ")}
              />
              Annulée
            </div>

            <div
              className={[
                "flex items-center gap-2 text-sm",
                statusRaw === "Refunded"
                  ? "text-emerald-600 font-medium"
                  : "text-gray-600",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block w-2.5 h-2.5 rounded-full",
                  statusRaw === "Refunded" ? "bg-emerald-600" : "bg-gray-300",
                ].join(" ")}
              />
              Remboursée
            </div>
          </div>
        </div>
      </div>

      {/* section méta */}
      <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 text-center md:text-left">
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Client</p>
          <p className="text-sm font-medium">{order.clientName}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Date</p>
          <p className="text-sm font-medium">
            {new Date(order.createdAt).toLocaleString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {isPickup ? "Retrait" : "Livraison"}
          </p>
          <p className="text-sm font-medium whitespace-pre-line">
            {deliveryLabel}
          </p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Paiement</p>
          <p className="text-sm font-medium">{paymentLabel}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">
            {isPickup ? "Magasin" : "Adresse"}
          </p>
          <p className="text-sm font-medium whitespace-pre-line">
            {isPickup ? magasinLabel : addressLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 items-end min-h-42">
        <div className="border-2 border-primary rounded-md w-full p-1">
          <table className="w-full text-sm">
            <thead className="bg-primary text-white">
              <tr>
                <th className="py-1 px-2 text-left border-r-4">Produit</th>
                <th className="py-1 px-2 text-right border-r-4">Qté</th>
                <th className="py-1 px-2 text-right border-r-4">PU TTC</th>
                <th className="py-1 px-2 text-right border-r-4">Remise</th>
                <th className="py-1 px-2 text-right border-r-4">TVA</th>
                <th className="py-1 px-2 text-right">Total TTC</th>
              </tr>
            </thead>

            <tbody>
              {order.orderItems.map((it, idx) => {
                const puRemise = it.price * (1 - it.discount / 100);
                const lineTTC = puRemise * it.quantity;

                const attrLine = it.attributes?.length
                  ? it.attributes.map((row) => `${row.name} : ${row.value}`).join(", ")
                  : "";

                return (
                  <tr key={rowKey(it, idx)} className="border-t align-top">
                    <td className="py-1 px-2">
                      <div>{it.name}</div>
                      <div className="text-xs text-gray-500">{it.reference}</div>
                      {attrLine && (
                        <div className="text-xs text-gray-500">{attrLine}</div>
                      )}
                    </td>
                    <td className="py-1 px-2 text-right">{it.quantity}</td>
                    <td className="py-1 px-2 text-right">
                      {frFmt(puRemise)}
                      {it.discount > 0 && (
                        <span className="ml-1 line-through text-xs text-gray-500">
                          {frFmt(it.price)}
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-right">
                      {it.discount > 0 ? `${it.discount}%` : "—"}
                    </td>
                    <td className="py-1 px-2 text-right">{it.tva}%</td>
                    <td className="py-1 px-2 text-right">{frFmt(lineTTC)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totaux séparés */}
        <div className="border-2 border-primary rounded-md w-[30%] p-1">
          <table className="text-sm rounded-xl w-full">
            <tbody>
              <tr className="bg-primary text-white">
                <td colSpan={5} className="py-1 px-2 text-left border-r-4">
                  Sous-total articles
                </td>
                <td className="py-1 px-2 text-right">{frFmt(totalLinesTTC)}</td>
              </tr>
              <tr className="">
                <td colSpan={5} className="py-1 px-2 text-left text-gray-600">
                  Frais de livraison
                </td>
                <td className="py-1 px-2 text-right">{frFmt(deliveryCostTotal)}</td>
              </tr>
              <tr className="font-semibold bg-primary text-white ">
                <td colSpan={5} className="py-1 px-2 text-left border-r-4">
                  Total
                </td>
                <td className="py-1 px-2 text-right">{frFmt(totalTTC)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ---------- Download buttons ---------- */}
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleDownloadBL}
            disabled={downloading !== false}
            className="rounded-md border border-primary px-4 py-2.5 text-sm text-primary hover:bg-primary hover:text-white cursor-pointer"
            title="Télécharger le bon de livraison"
          >
            Télécharger bon de livraison
          </button>
        </div>
      </div>
    </div>
  );
}
