/* ------------------------------------------------------------------
   components/create-order/QuoteProforma.tsx
   Génération du document PDF (html2canvas → jsPDF)
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { BasketItem } from "./selectProducts";
import { DeliveryOption } from "./selectDeliveryOption";
import { Magasin } from "./SelectMagasins";
import { useCurrency } from "@/contexts/CurrencyContext";

/* ---------- props ---------- */
interface QuoteProformaProps {
  quoteRef: string;
  company: {
    name: string;
    logoImageUrl: string;
    phone: string;
    address: string;
    city: string;
    governorate: string;
    zipcode: number;
  };
  clientLabel: string;
  addressLabel: string | null;
  magasin: Magasin | null;
  delivery: DeliveryOption | null;
  basket: BasketItem[];
  paymentMethod?: string | null;
  date: string;
}

/* ---------- helpers ---------- */
const InlineOrImg: React.FC<{
  url: string;
  className?: string;
  alt?: string;
}> = ({ url, className, alt }) => {
  const [svgMarkup, setSvgMarkup] = useState<string | null>(null);
  const isSvg = /\.svg($|\?)/i.test(url);

  useEffect(() => {
    if (!isSvg) return;
    let cancelled = false;

    fetch(url)
      .then((r) => r.text())
      .then((txt) => {
        if (cancelled) return;
        const cleaned = txt
          .replace(/(fill|stroke)="[^"]*"/gi, "")
          .replace(/(width|height)="[^"]*"/gi, "")
          .replace(
            /<svg([^>]*)>/i,
            `<svg$1 class="fill-current stroke-current w-full h-full">`
          );
        setSvgMarkup(cleaned);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [url, isSvg]);

  if (isSvg && svgMarkup) {
    return (
      <span
        className={className}
        role="img"
        aria-label={alt}
        dangerouslySetInnerHTML={{ __html: svgMarkup }}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={alt ?? ""}
      width={298}
      height={64}
      className={className}
      style={{ objectFit: "contain" }}
      unoptimized
    />
  );
};

/** Build a unique, stable key from product id/reference + chosen attributes + index */
const lineKey = (it: BasketItem, idx: number) => {
  const sig = Object.entries(it.chosen ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${v}`)
    .join("|");
  const base = it._id || it.reference || "item";
  return `${base}|${sig}|${idx}`;
};

/* ---------- component ---------- */
const QuoteProforma: React.FC<QuoteProformaProps> = ({
  quoteRef,
  company,
  clientLabel,
  addressLabel,
  magasin,
  delivery,
  basket,
  paymentMethod,
  date,
}) => {
  const { fmt } = useCurrency();

  /* ----- per-item + global totals ----- */
  const lines = basket.map((it) => {
    const unitTTC = it.discount > 0 ? it.price * (1 - it.discount / 100) : it.price;
    const unitHT = unitTTC / (1 + it.tva / 100);
    const lineHT = unitHT * it.quantity;
    const lineTVA = unitTTC * it.quantity - lineHT;
    const lineTTC = unitTTC * it.quantity;
    return { ...it, unitHT, lineHT, lineTVA, lineTTC };
  });

  const totalHT = lines.reduce((s, l) => s + l.lineHT, 0);
  const totalTVA = lines.reduce((s, l) => s + l.lineTVA, 0);
  const totalTTC = lines.reduce((s, l) => s + l.lineTTC, 0) + (delivery ? delivery.price : 0);

  /* ---------- UI ---------- */
  return (
    <div
      style={{
        position: "relative",
        width: "210mm",
        minHeight: "297mm",
        backgroundColor: "#ffffff",
        color: "#000000",
        borderRadius: "1rem",
        padding: "1.5rem",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700 }}>Devis</h1>
        <div style={{ width: "298px", height: "64px" }}>
          <InlineOrImg url={company.logoImageUrl} alt={`${company.name} logo`} />
        </div>
      </div>
      <div style={{ height: "1px", backgroundColor: "#2dd4bf", margin: "1rem 0" }} />

      {/* Company & Metadata */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          columnGap: "1.5rem",
          rowGap: "1.5rem",
          fontSize: "0.875rem",
        }}
      >
        {/* Company block */}
        <div>
          <p style={{ margin: 0, textTransform: "uppercase", fontWeight: 600 }}>
            {company.name}
          </p>
          <p style={{ margin: 0, fontSize: "0.775rem" }}>{company.address}</p>
          <p style={{ margin: 0, fontSize: "0.775rem" }}>
            {company.city} {company.zipcode}, {company.governorate}
          </p>
          <p style={{ margin: 0, fontSize: "0.775rem", fontStyle: "italic" }}>
            Téléphone : {company.phone}
          </p>

          {/* Metadata card */}
          <div
            style={{
              backgroundColor: "#f9fafb",
              padding: "1rem",
              borderRadius: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                fontSize: "0.75rem",
              }}
            >
              <span>Date :</span>
              <span style={{ fontWeight: 500 }}>{date}</span>

              <span>N° de devis :</span>
              <span style={{ fontWeight: 500 }}>{quoteRef}</span>

              <span>Mode :</span>
              <span style={{ fontWeight: 500 }}>{delivery?.name ?? "—"}</span>

              <span>Frais liv. :</span>
              <span style={{ fontWeight: 500 }}>
                {delivery ? fmt(delivery.price) : "—"}
              </span>

              <span>Paiement :</span>
              <span style={{ fontWeight: 500 }}>{paymentMethod ?? "—"}</span>
            </div>
          </div>
        </div>

        {/* Client / adresse */}
        <div>
          <p style={{ margin: 0, fontWeight: 600 }}>Client</p>
          <p style={{ whiteSpace: "pre-line" }}>{clientLabel}</p>

          <p style={{ margin: "1rem 0 0 0", fontWeight: 600 }}>
            {delivery?.isPickup ? "Magasin" : "Adresse"}
          </p>
          <p style={{ whiteSpace: "pre-line" }}>
            {delivery?.isPickup
              ? magasin
                ? `${magasin.name}\n${magasin.address ?? ""}`
                : "—"
              : addressLabel ?? "—"}
          </p>
        </div>
      </div>

      <div style={{ height: "1px", backgroundColor: "#2dd4bf", margin: "1rem 0" }} />

      {/* Products Table */}
      <div style={{ overflowX: "auto", fontSize: "0.875rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Produit", "Qté", "PU HT", "% TVA", "Remise", "Total TTC"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.5rem",
                    textAlign: h === "Produit" ? "left" : "right",
                    borderBottom: "2px solid #2dd4bf",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lines.map((l, idx) => (
              <tr key={lineKey(l, idx)} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "0.5rem", textAlign: "left" }}>
                  {l.name}
                  {l.attributes?.length ? (
                    <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>
                      {l.attributes
                        .map((row) => {
                          const id = row.attributeSelected._id;
                          const val = l.chosen[id];
                          return val ? `${row.attributeSelected.name}: ${val}` : null;
                        })
                        .filter(Boolean)
                        .join(", ")}
                    </div>
                  ) : null}
                </td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>{l.quantity}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>{fmt(l.unitHT)}</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>{l.tva}%</td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>
                  {l.discount > 0 ? `${l.discount}%` : "—"}
                </td>
                <td style={{ padding: "0.5rem", textAlign: "right" }}>{fmt(l.lineTTC)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div style={{ display: "flex", justifyContent: "flex-end", fontSize: "0.875rem", paddingTop: "1rem" }}>
        <div style={{ width: "100%", maxWidth: "33%", display: "grid", gap: "0.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total HT</span>
            <span>{fmt(totalHT)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Total TVA</span>
            <span>{fmt(totalTVA)}</span>
          </div>
          {delivery && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Frais livraison</span>
              <span>{fmt(delivery.price)}</span>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: 600,
              borderTop: "1px solid #e5e7eb",
              paddingTop: "0.25rem",
            }}
          >
            <span>Total TTC</span>
            <span>{fmt(totalTTC)}</span>
          </div>
        </div>
      </div>

      {/* Signature & Thank you */}
      <div
        style={{
          position: "absolute",
          bottom: "3.5rem",
          right: "1.5rem",
          textAlign: "left",
          fontSize: "0.875rem",
        }}
      >
        <p style={{ fontSize: "0.475rem", margin: 0, borderTop: "1px solid #000", width: "150px" }}>
          Signature et cachet
        </p>
        <p style={{ margin: 0, fontSize: "0.775rem" }}>Fait le : {date}</p>
        <p style={{ marginTop: "0.2rem", fontStyle: "italic" }}>
          Merci pour votre confiance&nbsp;!
        </p>
      </div>
    </div>
  );
};

export default QuoteProforma;
