// src/app/dashboard/manage-stock/products/voir/[productId]/page.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { FaSpinner } from "react-icons/fa6";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

type StockStatus = "in stock" | "out of stock";
type StatusPage = "none" | "new-products" | "promotion" | "best-collection";
type Vadmin = "not-approve" | "approve";

type AttrValueItem =
  | { name: string; value?: string; image?: string }
  | { name: string; hex: string; image?: string };

interface FetchedAttribute {
  attributeSelected: string;
  attributeName: string;
  value: string | AttrValueItem[];
}

interface FetchedProduct {
  _id: string;
  name: string;
  info: string;
  description: string;
  categorie: { _id: string; name: string } | string | null;
  subcategorie: { _id: string; name: string } | string | null;
  magasin: { _id: string; name: string } | string | null;
  brand: { _id: string; name: string } | string | null;
  stock: number;
  price: number;
  tva: number;
  discount: number;
  stockStatus: StockStatus;
  statuspage: StatusPage;
  vadmin: Vadmin;
  attributes: FetchedAttribute[];
  productDetails: {
    name: string;
    description?: string;
    image?: string | null;
  }[];
  mainImageUrl?: string;
  extraImagesUrl?: string[];
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------ helpers ------------------------------ */
const isObject = (x: unknown): x is Record<string, unknown> =>
  typeof x === "object" && x !== null;

const isColorPair = (
  x: unknown
): x is { name: string; hex: string; image?: string } => {
  if (!isObject(x)) return false;
  const { name, hex, image } = x as Record<string, unknown>;
  return (
    typeof name === "string" &&
    typeof hex === "string" &&
    (image === undefined || typeof image === "string")
  );
};

const hasValuePair = (
  x: unknown
): x is { name: string; value: string; image?: string } => {
  if (!isObject(x)) return false;
  const { name, value, image } = x as Record<string, unknown>;
  return (
    typeof name === "string" &&
    typeof value === "string" &&
    (image === undefined || typeof image === "string")
  );
};

const hasImage = (x: unknown): x is { image: string } =>
  isObject(x) && typeof (x as Record<string, unknown>).image === "string";

const renderName = (field: { name: string } | string | null | undefined) => {
  if (!field) return "—";
  return typeof field === "string" ? field : field.name ?? "—";
};

/* --------------------------------- page -------------------------------- */
type TabId = "infos" | "images" | "statuts" | "attributs" | "details";

export default function ProductViewPage() {
  const { productId } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState<FetchedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    fetchFromAPI<FetchedProduct>(`/dashboardadmin/stock/products/${productId}`)
      .then((data) => {
        setProduct(data);
        setError(null);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load product")
      )
      .finally(() => setLoading(false));
  }, [productId]);

  /* ------------------------------ StepReview UI ----------------------------- */
  const tabs: Array<{ id: TabId; label: string }> = useMemo(
    () => [
      { id: "infos", label: "Informations" },
      { id: "images", label: "Images" },
      { id: "statuts", label: "Statuts" },
      { id: "attributs", label: "Attributs" },
      { id: "details", label: "Détails" },
    ],
    []
  );
  const [active, setActive] = useState<TabId>("infos");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    infos: null,
    images: null,
    statuts: null,
    attributs: null,
    details: null,
  });
  const switchTab = (id: TabId) => setActive(id);
  const onKeyNav = (e: React.KeyboardEvent, idx: number) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const order = tabs.map((t) => t.id);
    let nextIndex = idx;
    if (e.key === "ArrowLeft")
      nextIndex = (idx - 1 + order.length) % order.length;
    if (e.key === "ArrowRight") nextIndex = (idx + 1) % order.length;
    if (e.key === "Home") nextIndex = 0;
    if (e.key === "End") nextIndex = order.length - 1;
    const nextId = order[nextIndex] as TabId;
    setActive(nextId);
    tabRefs.current[nextId]?.focus();
  };

  const badge = (text: string, tone: "green" | "amber" | "slate") => {
    const tones =
      tone === "green"
        ? "bg-green-50 text-green-700 ring-green-600/20"
        : tone === "amber"
        ? "bg-amber-50 text-amber-700 ring-amber-600/20"
        : "bg-slate-50 text-slate-700 ring-slate-600/20";
    return (
      <span
        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${tones}`}
      >
        {text}
      </span>
    );
  };

  const statusBadge = (
    k: "stockStatus" | "statuspage" | "vadmin",
    v?: string
  ) => {
    const val = v ?? "—";
    if (k === "stockStatus")
      return badge(val, val === "in stock" ? "green" : "amber");
    if (k === "vadmin")
      return badge(val, val === "approve" ? "green" : "amber");
    return badge(val, "slate");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="p-4">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-quaternary text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }
  if (!product) return <p className="p-4">Product not found.</p>;

  const fieldLabels = {
    name: "Nom",
    description: "Description",
    info: "Infos",
    categorie: "Catégorie",
    subcategorie: "Sous-catégorie",
    magasin: "Magasin",
    brand: "Marque",
    stock: "Stock",
    price: "Prix",
    tva: "TVA",
    discount: "Remise",
  } as const;

  type PrimaryField = keyof typeof fieldLabels;

  const primaryOrder: PrimaryField[] = [
    "name",
    "description",
    "info",
    "categorie",
    "subcategorie",
    "magasin",
    "brand",
    "stock",
    "price",
    "tva",
    "discount",
  ];

  const formatValue = (k: PrimaryField): string => {
    switch (k) {
      case "categorie":
        return renderName(product.categorie);
      case "subcategorie":
        return renderName(product.subcategorie);
      case "magasin":
        return renderName(product.magasin);
      case "brand":
        return renderName(product.brand);
      case "price":
        return `$${product.price.toFixed(2)}`;
      case "tva":
        return `${product.tva}%`;
      case "discount":
        return `${product.discount}%`;
      case "name":
        return product.name ?? "—";
      case "info":
        return product.info ?? "—";
      case "description":
        return product.description ?? "—";
      case "stock":
        return String(product.stock ?? "—");
      default:
        return "—";
    }
  };

  const Panel = ({
    id,
    children,
  }: {
    id: TabId;
    children: React.ReactNode;
  }) => (
    <div
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      hidden={active !== id}
      className="pt-5"
    >
      {children}
    </div>
  );

  return (
    <section className="mx-auto py-4 w-[95%] flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Product Details</h1>
        <button
          onClick={() => router.back()}
          className="w-fit rounded-md border border-gray-300 px-4 py-2.5 text-sm flex items-center gap-4 hover:bg-primary hover:text-white cursor-pointer"
        >
          Back to list
        </button>
      </div>

      {/* Tabs */}
      <nav className="border-b border-slate-200">
        <div
          role="tablist"
          aria-label="Onglets récapitulatif"
          className="flex gap-6"
        >
          {tabs.map((t, idx) => {
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                type="button"
                className={`group relative -mb-px px-3 pt-2 pb-2 text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "text-secondary"
                    : "hover:text-secondary text-primary"
                }`}
                onClick={() => switchTab(t.id)}
                onKeyDown={(e) => onKeyNav(e, idx)}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                tabIndex={isActive ? 0 : -1}
                // IMPORTANT: return void (don’t return the assignment value)
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
              >
                {t.label}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-2 right-2 -bottom-[1px] h-0.5 rounded transition-opacity ${
                    isActive
                      ? "bg-secondary opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-hover:bg-secondary"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>

      {/* Panels */}
      <Panel id="infos">
        <dl className="grid md:grid-cols-2 gap-x-6 gap-y-3">
          {primaryOrder.map((k) => (
            <div
              key={k}
              className={`flex flex-col ${
                k === "description" || k === "info" ? "md:col-span-2" : ""
              }`}
            >
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                {fieldLabels[k]}
              </dt>
              <dd
                className={
                  "text-sm text-slate-800 " +
                  (k === "description" ? "whitespace-pre-wrap" : "")
                }
              >
                {formatValue(k)}
              </dd>
            </div>
          ))}
          {/* Meta */}
          <div className="md:col-span-2 grid md:grid-cols-2 gap-x-6 gap-y-3 mt-2">
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Créé par
              </dt>
              <dd className="text-sm text-slate-800">
                {product.createdBy?.username ?? "—"}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Créé le
              </dt>
              <dd className="text-sm text-slate-800">
                {new Date(product.createdAt).toLocaleString()}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Modifié par
              </dt>
              <dd className="text-sm text-slate-800">
                {product.updatedBy?.username ?? "—"}
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-xs uppercase tracking-wide text-slate-500">
                Modifié le
              </dt>
              <dd className="text-sm text-slate-800">
                {new Date(product.updatedAt).toLocaleString()}
              </dd>
            </div>
          </div>
        </dl>
      </Panel>

      <Panel id="images">
        <div className="flex flex-col gap-5">
          {/* Main Image */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium text-slate-700">
              Image principale
            </h4>
            <div className="w-[160px] h-[120px] rounded overflow-hidden bg-slate-50 flex items-center justify-center">
              {product.mainImageUrl ? (
                <Image
                  src={product.mainImageUrl}
                  alt={`${product.name} main`}
                  width={160}
                  height={120}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-slate-400 text-xs">Aucune image</span>
              )}
            </div>
          </div>

          {/* Extra Images */}
          <div className="flex flex-col gap-2">
            <h4 className="text-sm font-medium text-slate-700">
              Images supplémentaires
            </h4>
            {(product.extraImagesUrl?.length ?? 0) === 0 ? (
              <span className="text-xs text-slate-400">
                Aucune image supplémentaire
              </span>
            ) : (
              <div className="flex flex-wrap gap-4">
                {product.extraImagesUrl!.map((url, i) => (
                  <div
                    key={i}
                    className="w-[72px] h-[72px] rounded overflow-hidden bg-slate-50"
                  >
                    <Image
                      src={url}
                      alt={`${product.name} extra ${i + 1}`}
                      width={72}
                      height={72}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Panel>

      <Panel id="statuts">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">État du stock :</span>
            {statusBadge("stockStatus", product.stockStatus)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Statut de la page :</span>
            {statusBadge("statuspage", product.statuspage)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Validation admin :</span>
            {statusBadge("vadmin", product.vadmin)}
          </div>
        </div>
      </Panel>

      <Panel id="attributs">
        {product.attributes.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun attribut sélectionné.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {product.attributes.map((a, idx) => (
              <div
                key={`${a.attributeSelected}-${idx}`}
                className="border rounded-lg p-4"
              >
                <h4 className="font-medium mb-2">{a.attributeName}</h4>
                {Array.isArray(a.value) ? (
                  <ul className="space-y-2">
                    {a.value.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-slate-800">
                          {item.name}
                          {hasValuePair(item) && item.value
                            ? ` : ${item.value}`
                            : ""}
                          {isColorPair(item) && item.hex
                            ? ` : ${item.hex}`
                            : ""}
                        </span>
                        {isColorPair(item) && item.hex && (
                          <span
                            className="inline-block w-4 h-4 rounded border"
                            style={{ background: item.hex }}
                            aria-label="Couleur"
                          />
                        )}
                        {hasImage(item) && item.image && (
                          <Image
                            src={item.image}
                            alt="Aperçu attribut"
                            width={28}
                            height={28}
                            className="object-cover rounded border"
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-800">{a.value}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel id="details">
        {product.productDetails.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun détail produit.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {product.productDetails.map((d, i) => (
              <div key={i} className="border rounded-lg p-4 flex gap-4">
                {d.image && (
                  <div className="w-28 h-28 shrink-0 rounded overflow-hidden border bg-slate-50">
                    <Image
                      src={d.image}
                      alt={d.name}
                      width={112}
                      height={112}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{d.name}</h4>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap mt-1">
                    {d.description ?? "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}
