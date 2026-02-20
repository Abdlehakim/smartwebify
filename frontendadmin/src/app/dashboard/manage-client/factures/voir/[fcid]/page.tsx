/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/factures/voir/[fcid]/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import LoadingDots from "@/components/LoadingDots";
import { generatePdf } from "@/lib/generatePdf";

/* ---------- types (mirror backend model) ---------- */
interface FactureItemAttribute {
  attribute: string; // ObjectId string
  name: string;
  value: string;
}
interface FactureItem {
  product: string; // ObjectId string
  reference: string;
  name: string;
  tva: number;        // %
  quantity: number;
  discount: number;   // per-unit discount (amount OR %) — handled flexibly
  price: number;      // unit price HT
  attributes?: FactureItemAttribute[];
}
interface FacturePaymentMethod {
  PaymentMethodID: string;
  PaymentMethodLabel: string;
}
interface FactureDeliveryMethod {
  deliveryMethodID: string;
  deliveryMethodName?: string;
  Cost: string; // string in model
  expectedDeliveryDate?: string;
}
interface FactureDeliveryAddress {
  AddressID: string;
  DeliverToAddress: string;
}
interface FacturePickupMagasin {
  MagasinID: string;
  MagasinName?: string;
  MagasinAddress: string;
}
interface Facture {
  _id: string;
  ref: string;              // e.g., FC-1-2025 (keep as-is)
  seq: number;
  year: number;
  order: string;            // ObjectId string
  orderRef?: string;        // e.g., ORDER-123
  client: string;           // ObjectId string
  clientName: string;
  deliveryAddress?: FactureDeliveryAddress | null;
  pickupMagasin?: FacturePickupMagasin | null;
  paymentMethod?: FacturePaymentMethod | null;
  deliveryMethod?: FactureDeliveryMethod | null;
  items: FactureItem[];
  currency: string;         // "TND" etc.
  subtotalHT: number;
  tvaTotal: number;
  shippingCost: number;
  grandTotalTTC: number;
  status: "Paid" | "Cancelled";
  issuedAt: string;         // ISO date
  paidAt?: string;
  cancelledAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

/* ---------- helpers ---------- */
const toNumber = (v: unknown) => {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v).replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};
const frFmt = (n: number, currency = "TND") =>
  `${n.toFixed(2).replace(".", ",")} ${currency}`;

/** Unique, stable key for a line: product + reference + attributes + index */
const rowKey = (it: FactureItem, idx: number) => {
  const attrSig = (it.attributes ?? [])
    .map((a) => `${a.attribute}:${a.value}`)
    .sort()
    .join("|");
  return `${it.product}|${it.reference}|${attrSig}|${idx}`;
};

export default function FactureDetailsPage() {
  const { fcid } = useParams() as { fcid: string };

  const [facture, setFacture] = useState<Facture | null>(null);
  const [loading, setLoading] = useState(true);

  /* download overlay state (only 'invoice') */
  const [downloading, setDownloading] = useState<false | "invoice">(false);
  const [dlSuccess, setDlSuccess] = useState(false);

  /* fetch facture */
  useEffect(() => {
    (async () => {
      try {
        const { facture } = await fetchFromAPI<{ facture: Facture }>(
          `/dashboardadmin/factures/${fcid}`
        );
        setFacture(facture);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [fcid]);

  if (loading)
    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <LoadingDots loadingMessage="Chargement de la facture…" />
      </div>
    );

  if (!facture) return <div className="p-8">Facture introuvable.</div>;

  /* meta computed */
  const currency = facture.currency || "TND";
  const isPickup = !!facture.pickupMagasin;

  const addressLabel = facture.deliveryAddress?.DeliverToAddress || "—";

  const magasinLabel = facture.pickupMagasin
    ? (facture.pickupMagasin.MagasinName
        ? `${facture.pickupMagasin.MagasinName} — ${facture.pickupMagasin.MagasinAddress}`
        : facture.pickupMagasin.MagasinAddress)
    : "—";

  const paymentLabel = facture.paymentMethod?.PaymentMethodLabel || "—";

  const deliveryLabel = facture.deliveryMethod
    ? (() => {
        const cost = frFmt(toNumber(facture.deliveryMethod!.Cost), currency);
        const date = facture.deliveryMethod!.expectedDeliveryDate
          ? new Date(facture.deliveryMethod!.expectedDeliveryDate).toLocaleDateString("fr-FR")
          : "";
        const name = facture.deliveryMethod!.deliveryMethodName ?? "—";
        return date ? `${name} – ${cost} · ${date}` : `${name} – ${cost}`;
      })()
    : "—";

  /* totals */
  const totalLinesTTC = toNumber(facture.subtotalHT) + toNumber(facture.tvaTotal);
  const deliveryCostTotal = toNumber(facture.shippingCost);
  const totalTTC = toNumber(facture.grandTotalTTC);

  /* ---------- download handlers ---------- */
  const fileNameRef = facture.ref ?? facture._id; // keep FC-… exactly

  const withOverlay = async (action: () => Promise<void>) => {
    try {
      setDownloading("invoice");
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

  const handleDownloadInvoice = async () => {
    const refForPdf = facture?.ref || facture?.orderRef;
    if (!refForPdf) {
      console.error("Missing facture.ref and orderRef; cannot generate invoice PDF.");
      return;
    }
    await withOverlay(() =>
      generatePdf(`/pdf/invoice/${refForPdf}`, `FACTURE-${fileNameRef}.pdf`)
    );
  };

  const overlayMsg = "Génération de la facture…";

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

  /* ---------- helpers for line math (HT→TTC + flexible discount) ---------- */
  const unitTTC = (it: FactureItem) => {
    const isPercentDiscount = it.discount > 0 && it.discount <= 100;
    const unitHTAfterDiscount = isPercentDiscount
      ? it.price * (1 - it.discount / 100)
      : Math.max(0, it.price - it.discount);
    return unitHTAfterDiscount * (1 + it.tva / 100);
  };

  return (
    <div className="mx-auto py-4 w-[95%] flex flex-col gap-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          Facture {facture.ref}
          <span
            className={[
              "text-xs px-2 py-1 rounded",
              facture.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
            ].join(" ")}
            title={facture.status === "Paid" ? "Payée" : "Annulée"}
          >
            {facture.status === "Paid" ? "Payée" : "Annulée"}
          </span>
        </h1>

        <Link
          href="/dashboard/manage-client/factures"
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          ← Retour
        </Link>
      </div>

      {/* section méta */}
      <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 text-center md:text-left">
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Client</p>
          <p className="text-sm font-medium">{facture.clientName}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Date</p>
          <p className="text-sm font-medium">
            {new Date(facture.issuedAt).toLocaleString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">{isPickup ? "Retrait" : "Livraison"}</p>
          <p className="text-sm font-medium whitespace-pre-line">{deliveryLabel}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Paiement</p>
          <p className="text-sm font-medium">{paymentLabel}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">{isPickup ? "Magasin" : "Adresse"}</p>
          <p className="text-sm font-medium whitespace-pre-line">
            {isPickup ? magasinLabel : addressLabel}
          </p>
        </div>
      </div>

      {/* table + totals + action */}
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
              {facture.items.map((it, idx) => {
                const uTTC = unitTTC(it);
                const lineTTC = uTTC * it.quantity;

                const isPercentDiscount = it.discount > 0 && it.discount <= 100;
                const remiseDisplay =
                  it.discount > 0
                    ? (isPercentDiscount ? `${it.discount}%` : frFmt(it.discount, currency))
                    : "—";

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
                    <td className="py-1 px-2 text-right">{frFmt(uTTC, currency)}</td>
                    <td className="py-1 px-2 text-right">{remiseDisplay}</td>
                    <td className="py-1 px-2 text-right">{it.tva}%</td>
                    <td className="py-1 px-2 text-right">{frFmt(lineTTC, currency)}</td>
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
                <td className="py-1 px-2 text-right">
                  {frFmt(totalLinesTTC, currency)}
                </td>
              </tr>
              <tr>
                <td colSpan={5} className="py-1 px-2 text-left text-gray-600">
                  Frais de livraison
                </td>
                <td className="py-1 px-2 text-right">
                  {frFmt(deliveryCostTotal, currency)}
                </td>
              </tr>
              <tr className="font-semibold bg-primary text-white">
                <td colSpan={5} className="py-1 px-2 text-left border-r-4">
                  Total
                </td>
                <td className="py-1 px-2 text-right">
                  {frFmt(totalTTC, currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ---------- Download button (always enabled) ---------- */}
        <div className="mt-2 flex items-center gap-3">
          <button
            onClick={handleDownloadInvoice}
            className="rounded-md border border-primary px-4 py-2.5 text-sm text-primary hover:bg-primary hover:text-white cursor-pointer"
            title="Télécharger la facture"
          >
            Télécharger facture
          </button>
        </div>
      </div>
    </div>
  );
}
