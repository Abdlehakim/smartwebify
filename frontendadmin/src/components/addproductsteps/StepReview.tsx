// ───────────────────────────────────────────────────────────────
// src/components/addproductsteps/StepReview.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";
import type {
  AttributePayload,
  ProductDetailPair,
} from "@/components/addproductsteps/StepAttributesDetails";
import type { DimPair } from "@/components/productattribute/Dimension";
import type { ColorPair } from "@/components/productattribute/Color";
import type { OtherPair } from "@/components/productattribute/OtherType";

interface Props {
  form: ProductForm;
  mainImage: File | null;
  extraImages?: File[];
  existingMainImageUrl?: string | null;
  existingExtraImagesUrls?: string[];
  attrPayload: AttributePayload[];
  detailsPayload: ProductDetailPair[];
  lookupMaps: {
    categories: Record<string, string>;
    subcategories: Record<string, string>;
    magasins: Record<string, string>;
    brands: Record<string, string>;
  };
}

type AttrRow = DimPair | ColorPair | OtherPair;
type TabId = "infos" | "images" | "statuts" | "attributs" | "details";

/* ------------------------- helpers ------------------------- */
function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}
function isColorPair(x: unknown): x is ColorPair {
  return (
    isObject(x) &&
    typeof (x as { name?: unknown }).name === "string" &&
    typeof (x as { hex?: unknown }).hex === "string"
  );
}
function hasValuePair(x: unknown): x is { name: string; value: string } {
  return (
    isObject(x) &&
    typeof (x as { name?: unknown }).name === "string" &&
    typeof (x as { value?: unknown }).value === "string"
  );
}
function hasImage(x: unknown): x is { image: string } {
  return isObject(x) && typeof (x as { image?: unknown }).image === "string";
}

/* --------------------- NiceSelect (copied from StepData) --------------------- */
type StringUnion = string;
interface NiceSelectProps<T extends StringUnion> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  display?: (v: T) => string;
  className?: string;
  minWidth?: number;
  allowClear?: boolean;
  clearLabel?: string;
}
function NiceSelect<T extends StringUnion>({
  value,
  options,
  onChange,
  display,
  className = "",
  minWidth = 160,
  allowClear = false,
  clearLabel = "Aucune",
}: NiceSelectProps<T>) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const label = display ? display(value) : String(value);

  const updatePos = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, minWidth) });
  }, [minWidth]);

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest("[data-niceselect-root]")) return;
      setOpen(false);
    };
    const onMove = () => updatePos();
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open, updatePos]);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        onClick={() => setOpen((s) => !s)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
                    bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100
                    focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className}`}
        style={{ minWidth }}
      >
        <span className="truncate">{label || "—"}</span>
        <FiChevronDown className="shrink-0" />
      </button>

      {open && pos &&
        createPortal(
          <div
            data-niceselect-root
            className="fixed z-[1000]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className="rounded-md border bg-white shadow-lg max-h-60 overflow-auto" role="listbox">
              {allowClear && (
                <button
                  type="button"
                  className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2
                              ${value === ("" as unknown as T) ? "bg-emerald-50 text-emerald-700" : "text-slate-700"}
                              hover:bg-emerald-100 hover:text-emerald-800`}
                  onClick={() => {
                    onChange("" as unknown as T);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={String(value) === ""}
                >
                  <span
                    className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border
                                ${String(value) === "" ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}
                  >
                    <FiCheck size={12} />
                  </span>
                  <span className="truncate">{clearLabel}</span>
                </button>
              )}

              {options.map((opt) => {
                const isActive = opt === value;
                const text = display ? display(opt) : String(opt);
                return (
                  <button
                    key={String(opt)}
                    type="button"
                    className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2
                                ${isActive ? "bg-emerald-50 text-emerald-700" : "text-slate-700"}
                                hover:bg-emerald-100 hover:text-emerald-800`}
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    role="option"
                    aria-selected={isActive}
                  >
                    <span
                      className={`inline-flex h-4 w-4 items-center justify-center rounded-sm border
                                  ${isActive ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 text-transparent"}`}
                    >
                      <FiCheck size={12} />
                    </span>
                    <span className="truncate">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/* ================================ Component ================================ */
export default function StepReview({
  form,
  mainImage,
  extraImages = [],
  existingMainImageUrl,
  existingExtraImagesUrls = [],
  attrPayload,
  detailsPayload,
  lookupMaps,
}: Props) {
  // Tabs
  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "infos", label: "Informations" },
    { id: "images", label: "Images" },
    { id: "statuts", label: "Statuts" },
    { id: "attributs", label: "Attributs" },
    { id: "details", label: "Détails" },
  ];
  const [active, setActive] = useState<TabId>("infos");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    infos: null,
    images: null,
    statuts: null,
    attributs: null,
    details: null,
  });

  const switchTab = (id: TabId) => setActive(id);

  // Keyboard navigation (← → Home End)
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

  const filePreview = (file: File) => URL.createObjectURL(file);

  const fieldLabels: Partial<Record<keyof ProductForm, string>> = useMemo(
    () => ({
      name: "Nom",
      info: "Infos",
      description: "Description",
      categorie: "Catégorie",
      subcategorie: "Sous-catégorie",
      magasin: "Magasin",
      brand: "Marque",
      stock: "Stock",
      price: "Prix",
      tva: "TVA",
      discount: "Remise",
      stockStatus: "État du stock",
      statuspage: "Statut de la page",
      vadmin: "Validation admin",
    }),
    []
  );

  // Order so that: Nom → Description → Infos → Catégorie → Sous-catégorie → rest
  const primaryOrder: (keyof ProductForm)[] = [
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

  const statusKeys: (keyof ProductForm)[] = [
    "stockStatus",
    "statuspage",
    "vadmin",
  ];

  const mapIdToName = (k: keyof ProductForm, v: unknown): string => {
    if (typeof v !== "string" || v.trim() === "") return "—";
    switch (k) {
      case "categorie":
        return lookupMaps.categories[v] ?? v;
      case "subcategorie":
        return lookupMaps.subcategories[v] ?? v;
      case "magasin":
        return lookupMaps.magasins[v] ?? v;
      case "brand":
        return lookupMaps.brands[v] ?? v;
      default:
        return v;
    }
  };

  const formatValue = (k: keyof ProductForm, v: unknown) => {
    if (v === null || v === undefined || v === "") return "—";
    if (
      k === "categorie" ||
      k === "subcategorie" ||
      k === "magasin" ||
      k === "brand"
    ) {
      return mapIdToName(k, v);
    }
    return String(v);
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

  const statusBadge = (k: keyof ProductForm, v: string | undefined) => {
    const val = v ?? "—";
    if (k === "stockStatus")
      return badge(val, val === "in stock" ? "green" : "amber");
    if (k === "vadmin")
      return badge(val, val === "approve" ? "green" : "amber");
    return badge(val, "slate");
  };

  const MainImage = () => (
    <div className="flex flex-col gap-2">
      <h4 className="text-sm font-medium text-slate-700">Image principale</h4>
      <div className="w-[160px] h-[120px] rounded overflow-hidden bg-slate-50 flex items-center justify-center">
        {mainImage ? (
          <Image
            src={filePreview(mainImage)}
            alt="Aperçu image principale"
            width={160}
            height={120}
            className="object-cover w-full h-full"
          />
        ) : existingMainImageUrl ? (
          <Image
            src={existingMainImageUrl}
            alt="Image principale existante"
            width={160}
            height={120}
            className="object-cover w-full h-full"
          />
        ) : (
          <span className="text-slate-400 text-xs">Aucune image</span>
        )}
      </div>
    </div>
  );

  const ExtraImages = () => {
    const any = extraImages.length + (existingExtraImagesUrls?.length ?? 0) > 0;
    if (!any)
      return (
        <span className="text-xs text-slate-400">
          Aucune image supplémentaire
        </span>
      );
    return (
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-medium text-slate-700">
          Images supplémentaires
        </h4>
        <div className="flex gap-4">
          {extraImages.map((f, i) => (
            <div
              key={`new-${i}`}
              className="w-[72px] h-[72px] overflow-hidden bg-slate-50"
            >
              <Image
                src={filePreview(f)}
                alt={`Image supplémentaire ${i + 1}`}
                width={72}
                height={72}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
          {existingExtraImagesUrls?.map((url, i) => (
            <div
              key={`exist-${i}`}
              className="w-[72px] h-[72px] rounded overflow-hidden bg-slate-50"
            >
              <Image
                src={url}
                alt={`Image supplémentaire ${i + 1}`}
                width={72}
                height={72}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </div>
    );
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
    <section className="flex flex-col gap-4">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold">Récapitulatif du produit</h2>
        <p className="text-sm text-slate-500">
          Basculez entre les onglets pour parcourir les informations.
        </p>
      </header>

      {/* --- Mobile dropdown (<= md): NiceSelect, identical look to StepData --- */}
      <div className="md:hidden">
        <label htmlFor="review-tab" className="sr-only">
          Onglet
        </label>
        <NiceSelect<TabId>
          value={active}
          options={tabs.map((t) => t.id) as readonly TabId[]}
          onChange={(v) => setActive(v)}
          display={(v) => tabs.find((t) => t.id === v)?.label ?? "—"}
          className="w-full"
        />
      </div>

      {/* --- Tabs (desktop ≥ md) — unchanged --- */}
      <nav className="border-b border-slate-200 hidden md:block">
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
                className={`group relative -mb-px px-3 pt-2 pb-2 text-sm font-medium transition-colors cursor-pointer
    ${isActive ? "text-secondary" : "hover:text-secondary text-primary"}`}
                onClick={() => switchTab(t.id)}
                onKeyDown={(e) => onKeyNav(e, idx)}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={isActive}
                aria-controls={`panel-${t.id}`}
                tabIndex={isActive ? 0 : -1}
                ref={(el: HTMLButtonElement | null) => {
  tabRefs.current[t.id] = el;
}}
              >
                {t.label}
                <span
                  aria-hidden="true"
                  className={`pointer-events-none absolute left-2 right-2 -bottom-[1px] h-0.5 rounded transition-opacity
      ${
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

      {/* --- Tab panels --- */}
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
                {fieldLabels[k] ?? (k as string)}
              </dt>
              <dd
                className={
                  "text-sm text-slate-800 " +
                  (k === "description" ? "whitespace-pre-wrap" : "")
                }
              >
                {formatValue(k, form[k])}
              </dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel id="images">
        <div className="flex flex-col gap-5">
          <MainImage />
          <ExtraImages />
        </div>
      </Panel>

      <Panel id="statuts">
        <div className="flex flex-wrap gap-3">
          {statusKeys.map((k) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-slate-500">{fieldLabels[k]} :</span>
              {statusBadge(k, String(form[k] ?? ""))}
            </div>
          ))}
        </div>
      </Panel>

      <Panel id="attributs">
        {attrPayload.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun attribut sélectionné.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {attrPayload.map((p) => (
              <div key={p.attributeSelected} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">{p.attributeName}</h4>

                {Array.isArray(p.value) ? (
                  <ul className="space-y-2">
                    {(p.value as AttrRow[]).map((item, i) => (
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
                  <p className="text-sm text-slate-800">{p.value}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel id="details">
        {detailsPayload.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun détail produit.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {detailsPayload.map((d, i) => (
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
