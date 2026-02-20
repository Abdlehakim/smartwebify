/* ------------------------------------------------------------------
   components/create-order/OrderPreview.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState, useCallback } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Client } from "./selectClient";
import { DeliveryOption } from "./selectDeliveryOption";
import { Magasin } from "./SelectMagasins";
import { BasketItem } from "./selectProducts";
import QuoteProforma from "./QuoteProforma";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

/* ---------- types ---------- */
interface CompanyInfo {
  name: string;
  logoImageUrl: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  zipcode: number;
}

interface OrderPreviewProps {
  onClose(): void;
  client: Client | null;
  addressLabel: string | null;
  magasin: Magasin | null;
  delivery: DeliveryOption | null;
  basket: BasketItem[];
  paymentMethod?: string | null;
}

const formatMagasin = (m: Magasin | null) =>
  m ? [m.name, m.address, m.city].filter(Boolean).join(", ") : "—";

/* ---------- helpers ---------- */
const frFmt = (n: number) => `${n.toFixed(2).replace(".", ",")} TND`;
const todayForPdf = new Date().toLocaleDateString("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** unique, stable key for a basket row */
const itemKey = (it: BasketItem, idx: number) => {
  const sig = Object.entries(it.chosen ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  const base = it._id || it.reference || "item";
  return `${base}|${sig}|${idx}`;
};

const OrderPreview: React.FC<OrderPreviewProps> = ({
  client,
  addressLabel,
  magasin,
  delivery,
  basket,
  paymentMethod,
}) => {
  /* ---------- société ---------- */
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  useEffect(() => {
    fetchFromAPI<CompanyInfo>("/website/header/getHeaderData")
      .then((data) => setCompany(data))
      .catch(() => {});
  }, []);

  /* ---------- totaux (comme la page de détails) ---------- */
  const totalLinesTTC = basket.reduce((sum, it) => {
    const puRemise = it.discount > 0 ? it.price * (1 - it.discount / 100) : it.price;
    return sum + puRemise * it.quantity;
  }, 0);

  const deliveryCostTotal = delivery?.price ?? 0;
  const totalTTC = totalLinesTTC + deliveryCostTotal;

  const isPickup = !!delivery?.isPickup;
  const paymentLabel = paymentMethod ?? "—";

  // Aligné au rendu de la page de détails : "Nom – coût"
  const deliveryLabel = delivery ? `${delivery.name} – ${frFmt(delivery.price)}` : "—";

  /* ---------- génération PDF ---------- */
  const handleDownloadQuote = useCallback(async () => {
    const el = document.getElementById("quote-to-download");
    if (!el) return;

    await new Promise((r) => setTimeout(r, 300));

    const canvas = await html2canvas(el, { useCORS: true });
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const imgW = 210;
    const imgH = (canvas.height * imgW) / canvas.width;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, imgW, imgH);
    pdf.save(`DEVIS-${todayForPdf.replace(/\s/g, "-")}.pdf`);
  }, []);

  return (
    <div className="mx-auto py-4 w-full flex flex-col gap-6 bg-white rounded-lg">
      {/* header */}
      <div className="flex items-center justify-between px-6">
        <h2 className="text-xl md:text-xl font-bold">Commande (prévisualisation)</h2>
      </div>

      {/* section méta */}
      <div className="flex flex-col md:flex-row md:divide-x divide-gray-200 text-center md:text-left px-6">
        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Client</p>
          <p className="text-sm font-medium">{client?.username ?? client?.name ?? "—"}</p>
        </div>

        <div className="flex-1 px-4 py-2">
          <p className="text-xs text-gray-400">Date</p>
          <p className="text-sm font-medium">
            {new Date().toLocaleString("fr-FR", {
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
            {isPickup ? formatMagasin(magasin) : (addressLabel ?? "—")}
          </p>
        </div>
      </div>

      {/* table articles + totaux séparés */}
      <div className="flex flex-col gap-4 items-end px-6">
        {/* Articles */}
        <div className="border-2 border-primary rounded-md w-full p-1 min-h-40">
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
              {basket.map((item, idx) => {
                const puRemise =
                  item.discount > 0 ? item.price * (1 - item.discount / 100) : item.price;
                const lineTTC = puRemise * item.quantity;

                const attrLine =
                  item.attributes?.length
                    ? item.attributes
                        .map((row) => {
                          const id = row.attributeSelected._id;
                          const val = item.chosen[id];
                          return val ? `${row.attributeSelected.name} : ${val}` : null;
                        })
                        .filter(Boolean)
                        .join(", ")
                    : "";

                return (
                  <tr key={itemKey(item, idx)} className="border-t align-top">
                    <td className="py-1 px-2">
                      <div>{item.name}</div>
                      <div className="text-xs text-gray-500">{item.reference}</div>
                      {attrLine && <div className="text-xs text-gray-500">{attrLine}</div>}
                    </td>
                    <td className="py-1 px-2 text-right">{item.quantity}</td>
                    <td className="py-1 px-2 text-right">
                      {frFmt(puRemise)}
                      {item.discount > 0 && (
                        <span className="ml-1 line-through text-xs text-gray-500">
                          {frFmt(item.price)}
                        </span>
                      )}
                    </td>
                    <td className="py-1 px-2 text-right">
                      {item.discount > 0 ? `${item.discount}%` : "—"}
                    </td>
                    <td className="py-1 px-2 text-right">{item.tva}%</td>
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
              <tr>
                <td colSpan={5} className="py-1 px-2 text-left text-gray-600">
                  Frais de livraison
                </td>
                <td className="py-1 px-2 text-right">{frFmt(deliveryCostTotal)}</td>
              </tr>
              <tr className="font-semibold bg-primary text-white">
                <td colSpan={5} className="py-1 px-2 text-left border-r-4">
                  Total
                </td>
                <td className="py-1 px-2 text-right">{frFmt(totalTTC)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="pt-2 px-6 flex justify-end">
        <button
          onClick={handleDownloadQuote}
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          Télécharger le devis
        </button>
      </div>

      {/* Élément caché (PDF) */}
      {company &&
        basket.length > 0 &&
        delivery &&
        (delivery.isPickup ? !!magasin : !!addressLabel) && (
          <div
            id="quote-to-download"
            style={{ position: "absolute", top: "-9999px", left: "-9999px" }}
          >
            <QuoteProforma
              quoteRef={`DEVIS-${Date.now()}`}
              company={company}
              clientLabel={client?.username ?? client?.name ?? "—"}
              addressLabel={addressLabel ?? "—"}
              magasin={magasin!}
              delivery={delivery!}
              basket={basket}
              paymentMethod={paymentMethod}
              date={todayForPdf}
            />
          </div>
        )}
    </div>
  );
};

export default OrderPreview;
