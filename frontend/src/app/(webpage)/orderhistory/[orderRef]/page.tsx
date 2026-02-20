// src/app/(webpage)/orderhistory/[orderRef]/page.tsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { FiDownload } from "react-icons/fi";

import { fetchData } from "@/lib/fetchData";
import { useCurrency } from "@/contexts/CurrencyContext";
import { generatePdf } from "@/lib/generatePdf";
import LoadingDots from "@/components/LoadingDots";

/* ---------- types ---------- */
interface OrderItemAttr {
  attribute: string; // attribute id
  name: string;      // e.g. "Couleur"
  value: string;     // e.g. "Bleu gris"
}

interface OrderItem {
  _id?: string;      // may be absent/duplicated on your data
  reference: string;
  name: string;
  tva: number;
  discount: number;
  quantity: number;
  mainImageUrl: string;
  price: number;
  attributes?: OrderItemAttr[];
}

interface DeliveryMethodItem {
  deliveryMethodID: string;
  deliveryMethodName?: string;
  Cost: string | number;
  expectedDeliveryDate?: string | Date;
}

interface PaymentMethodItem {
  PaymentMethodID: string;
  PaymentMethodLabel: string;
}

interface PickupMagasinItem {
  MagasinID: string;
  MagasinAddress: string;
  MagasinName?: string;
}

interface Order {
  ref: string;
  DeliveryAddress: Array<{ DeliverToAddress: string }>;
  pickupMagasin: PickupMagasinItem[];
  orderItems: OrderItem[];
  deliveryMethod?: DeliveryMethodItem[];
  paymentMethod?: PaymentMethodItem[];
  deliveryMethodLegacy?: string;
  paymentMethodLegacy?: string;
  deliveryCostLegacy?: number;
  expectedDeliveryDate?: string | Date;
  orderStatus: string;
  createdAt: string;
}

/* ---------- helpers ---------- */
const frDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

function toNumber(v: string | number | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function safeToDate(val?: string | Date): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/** Build a stable, unique key for a line item even when `_id` is missing/duplicated. */
function lineKey(it: OrderItem, idx: number): string {
  const attrs = (it.attributes ?? [])
    .map((a) => `${a.attribute}:${a.value}`)
    .sort()
    .join("|");
  const base = it._id || it.reference || "item";
  return `${base}|${attrs}|${idx}`;
}

/* ---------- page ---------- */
export default function OrderByRef() {
  const router = useRouter();
  const { orderRef } = useParams() as { orderRef: string };
  const { fmt } = useCurrency();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Download UI state
  const [downloading, setDownloading] = useState(false);
  const [downloadOk, setDownloadOk] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const orderData = await fetchData<Order>(
          `/client/order/getOrderByRef/${orderRef}`,
          { credentials: "include" }
        );
        setOrder(orderData || null);
      } catch (err) {
        console.error(err);
        setOrder(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [orderRef]);

  const telechargerPDF = useCallback(async () => {
    if (!order?.ref || downloading) return;

    setDownloadError(null);

    try {
      await generatePdf(
        `/pdf/invoice/${order.ref}`,
        `FACTURE-${order.ref.replace("ORDER-", "")}.pdf`,
        {
          onStart: () => setDownloading(true),
          onDownloaded: () => {
            setDownloadOk(true);
            setTimeout(() => setDownloadOk(false), 1200);
          },
          onError: (e) => {
            console.error(e);
            setDownloadError(
              e instanceof Error ? e.message : "Échec du téléchargement."
            );
          },
          onFinally: () => setDownloading(false),
        }
      );
    } catch {
      // handled above
    }
  }, [order?.ref, downloading]);

  if (loading) {
    return (
      <div className="w-[90%] md:w-[70%] mx-auto pt-16">
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 h-[632px] animate-pulse" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="w-[90%] md:w-[70%] mx-auto pt-16">
        <p className="text-center">Aucune commande trouvée.</p>
      </div>
    );
  }

  /* ---------- totals & derived fields ---------- */
  const itemsTotal = order.orderItems.reduce((sum, it) => {
    const unit = it.discount > 0 ? (it.price * (100 - it.discount)) / 100 : it.price;
    return sum + unit * it.quantity;
  }, 0);

  const dmArray = Array.isArray(order.deliveryMethod) ? order.deliveryMethod : [];
  const deliveryMethodText =
    dmArray.length > 0
      ? dmArray
          .map((d) => d.deliveryMethodName || "—")
          .filter(Boolean)
          .join(", ")
      : order.deliveryMethodLegacy || "—";

  const deliveryCostFromArray = dmArray.reduce((sum, d) => sum + toNumber(d.Cost), 0);
  const deliveryCost =
    typeof order.deliveryCostLegacy === "number"
      ? order.deliveryCostLegacy
      : deliveryCostFromArray;

  const computedTotal = itemsTotal + deliveryCost;

  const deliverAddress = order.DeliveryAddress[0]?.DeliverToAddress || "—";

  const isPickup = Array.isArray(order.pickupMagasin) && order.pickupMagasin.length > 0;
  const magasin = isPickup ? order.pickupMagasin[0] : null;
  const magasinDisplay = magasin
    ? [magasin.MagasinName, magasin.MagasinAddress].filter(Boolean).join(" – ")
    : "—";
  const addressLabel = isPickup ? "Magasin de retrait" : "Adresse de livraison";
  const addressValue = isPickup ? magasinDisplay : deliverAddress;

  let expectedDatesText: string | null = null;
  if (!isPickup && dmArray.length) {
    const dates = dmArray
      .map((d) => safeToDate(d.expectedDeliveryDate))
      .filter((dt): dt is Date => !!dt)
      .map((dt) => dt.toLocaleDateString("fr-FR"));
    if (dates.length) expectedDatesText = dates.join(" • ");
  }

  const paymentLabels =
    (order.paymentMethod || [])
      .map((p) => (p as PaymentMethodItem).PaymentMethodLabel)
      .filter(Boolean)
      .join(", ") || order.paymentMethodLegacy || "—";

  /* ---------- render ---------- */
  return (
    <div className="w-[90%] md:w-[80%] mx-auto pt-16 relative">
      {(downloading || downloadOk) && (
        <div className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div aria-live="polite" aria-busy={downloading}>
            <LoadingDots
              loadingMessage="Génération de la facture…"
              successMessage="Téléchargement démarré ✅"
              isSuccess={downloadOk}
            />
          </div>
        </div>
      )}

      {downloadError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {downloadError}
        </div>
      )}

      <div className="bg-gray-100 border border-gray-200 rounded-xl p-6 space-y-6 max-md:p-2">
        {/* meta */}
        <div className="md:flex md:divide-x divide-gray-200 text-center md:text-left">
          {(
            [
              ["N° de commande", `#${order.ref.replace("ORDER-", "")}`],
              ["Date de commande", frDate(order.createdAt)],
              ["Méthode de livraison", deliveryMethodText],
              ["Moyen de paiement", paymentLabels],
              [addressLabel, addressValue],
              ...(expectedDatesText
                ? ([["Date de livraison prévue", expectedDatesText]] as const)
                : []),
            ] as const
          ).map(([label, value]) => (
            <div key={`meta-${label}`} className="flex-1 pb-4 md:pb-0 md:pl-6 space-y-1">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="text-sm font-medium">{value}</p>
            </div>
          ))}
        </div>

        <hr className="border-2" />

        {/* items */}
        <div className="relative">
          <span aria-hidden className="hidden sm:block absolute inset-y-0 left-1/2 w-px bg-gray-200" />
          <div className="h-[420px] overflow-y-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 sm:gap-x-12">
              {order.orderItems.map((it, idx) => {
                const unit =
                  it.discount > 0 ? (it.price * (100 - it.discount)) / 100 : it.price;
                const lineTotal = unit * it.quantity;
                return (
                  <div key={lineKey(it, idx)} className="flex items-start justify-between gap-4">
                    <div className="relative w-20 h-20 rounded-lg">
                      <Image
                        src={it.mainImageUrl || "/placeholder.png"}
                        alt={it.name}
                        fill
                        className="object-cover rounded"
                        priority
                        sizes="(max-width: 768px) 100vw, 1280px"
                        quality={75}
                      />
                    </div>

                    <div className="flex-1 max-md:text-xs">
                      <h4 className="font-semibold">{it.name}</h4>
                      <p className="text-sm text-gray-500 max-md:text-xs">
                        Réf :&nbsp;{it.reference}
                      </p>

                      {Array.isArray(it.attributes) && it.attributes.length > 0 && (
                        <ul className="mt-1 text-xs text-gray-700 space-y-0.5">
                          {it.attributes.map((a, aIdx) => (
                            <li key={`${a.attribute}:${a.value}:${aIdx}`}>
                              <span className="font-semibold">{a.name} :</span>{" "}
                              <span>{a.value}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      <p className="text-sm text-gray-500 max-md:text-xs mt-1">
                        Quantité :&nbsp;{it.quantity}
                      </p>
                    </div>

                    <p className="font-semibold whitespace-nowrap max-md:text-xs">
                      {fmt(lineTotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <hr className="border-2" />

        {/* total */}
        <div className="flex justify-between flex-wrap items-center max-md:justify-center">
          <p className="text-gray-500 font-medium">
            Montant total :&nbsp;
            <span className="text-black font-semibold">{fmt(computedTotal)}</span>
          </p>
        </div>
      </div>

      {/* actions */}
      <div className="flex justify-between mt-4 gap-4">
        <button
          onClick={() => router.back()}
          className="mt-2 rounded-md border border-gray-300 px-2 py-2 text-sm text-black hover:text-white hover:bg-primary max-md:text-xs max-md:w-full"
        >
          Retour
        </button>
        <button
          onClick={telechargerPDF}
          disabled={downloading}
          className="mt-2 rounded-md border border-gray-300 px-3 py-2 text-sm text-black hover:text-white hover:bg-primary max-md:text-xs max-md:w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          aria-busy={downloading}
        >
          <FiDownload />
          {downloading ? "Téléchargement…" : "Télécharger la facture"}
        </button>
      </div>
    </div>
  );
}
