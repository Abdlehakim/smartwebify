// ───────────────────────────────────────────────────────────────
// src/components/addproductsteps/StepData.tsx
// ───────────────────────────────────────────────────────────────
"use client";

import React, {
  ChangeEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import type { ProductForm } from "@/app/dashboard/manage-stock/products/create/page";

/* Types for lists passed from the page */
export interface Category { _id: string; name: string; }
export interface SubCategory { _id: string; name: string; }
export interface Magasin { _id: string; name: string; }
export interface Brand { _id: string; name: string; }

/* Fields */
const DATA_FIELDS = [
  "categorie",
  "subcategorie",
  "magasin",
  "brand",
  "stock",
  "price",
  "tva",
  "discount",
] as const;
type DataField = typeof DATA_FIELDS[number];

const SELECT_KEYS = ["stockStatus", "statuspage", "vadmin"] as const;
type SelectField = typeof SELECT_KEYS[number];

/* required flags from Product schema */
const REQUIRED: Partial<Record<DataField | SelectField, boolean>> = {
  categorie: true,
  stock: true,
  price: true,
};

/* --------------------- NiceSelect (portal dropdown) --------------------- */
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
                    onChange("" as unknown as T); // empty selection
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
                      setOpen(false); // close dropdown after selection
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
interface Props {
  form: ProductForm;
  onFixed: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  STOCK_OPTIONS: readonly ProductForm["stockStatus"][];
  PAGE_OPTIONS: readonly ProductForm["statuspage"][];
  ADMIN_OPTIONS: readonly ProductForm["vadmin"][];
  categories: Category[];
  subcategories: SubCategory[];
  magasins: Magasin[];
  brands: Brand[];
}

export default function StepData({
  form,
  onFixed,
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
  categories,
  subcategories,
  magasins,
  brands,
}: Props) {
  const emit = (name: keyof ProductForm, value: string) => {
    const e = { target: { name, value } } as unknown as ChangeEvent<HTMLInputElement>;
    onFixed(e);
  };

  const Label = ({
    children,
    required,
  }: {
    children: React.ReactNode;
    required?: boolean;
  }) => (
    <span className="text-sm font-medium">
      {children} {required && <span className="text-red-600" title="Requis">*</span>}
    </span>
  );

  return (
    <section className="grid gap-6 grid-cols-2 md:grid-cols-2 xl:grid-cols-3 px-6">
      {DATA_FIELDS.map((field: DataField) => {
        if (field === "categorie") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <Label required={!!REQUIRED.categorie}>Catégorie</Label>
              <NiceSelect<string>
                value={form.categorie ?? ""}
                options={categories.map((c) => c._id)}
                onChange={(v) => emit("categorie", v)}
                display={(v) => categories.find((c) => c._id === v)?.name ?? "—"}
                /* required → no clear */
              />
            </label>
          );
        }
        if (field === "subcategorie") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <Label>Sous-catégorie</Label>
              <NiceSelect<string>
                value={form.subcategorie ?? ""}
                options={subcategories.map((s) => s._id)}
                onChange={(v) => emit("subcategorie", v)}
                display={(v) => subcategories.find((s) => s._id === v)?.name ?? "—"}
                allowClear
                clearLabel="Aucune"
              />
            </label>
          );
        }
        if (field === "magasin") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <Label>Magasin</Label>
              <NiceSelect<string>
                value={form.magasin ?? ""}
                options={magasins.map((m) => m._id)}
                onChange={(v) => emit("magasin", v)}
                display={(v) => magasins.find((m) => m._id === v)?.name ?? "—"}
                allowClear
                clearLabel="Aucune"
              />
            </label>
          );
        }
        if (field === "brand") {
          return (
            <label key={field} className="flex flex-col gap-1">
              <Label>Marque</Label>
              <NiceSelect<string>
                value={form.brand ?? ""}
                options={brands.map((b) => b._id)}
                onChange={(v) => emit("brand", v)}
                display={(v) => brands.find((b) => b._id === v)?.name ?? "—"}
                allowClear
                clearLabel="Aucune"
              />
            </label>
          );
        }

        return (
          <label key={field} className="flex flex-col gap-1">
            <Label required={!!REQUIRED[field]}>
              {field === "price" ? "Prix" :
               field === "stock" ? "Stock" :
               field === "tva" ? "TVA" :
               field === "discount" ? "Remise" : field}
            </Label>
            <input
              name={field}
              value={form[field] as string}
              onChange={onFixed}
              onFocus={(e) => (e.target as HTMLInputElement).select()}
              className="border border-gray-300 bg-inputcolor rounded px-3 py-2"
              required={!!REQUIRED[field]}
              inputMode={field === "price" || field === "stock" || field === "tva" || field === "discount" ? "decimal" : undefined}
            />
          </label>
        );
      })}

      {SELECT_KEYS.map((key: SelectField) => {
        if (key === "stockStatus") {
          return (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-sm font-medium">État du stock</span>
              <NiceSelect<ProductForm["stockStatus"]>
                value={form.stockStatus}
                options={STOCK_OPTIONS}
                onChange={(v) => emit("stockStatus", v)}
                display={(v) => v}
              />
            </label>
          );
        }
        if (key === "statuspage") {
          return (
            <label key={key} className="flex flex-col gap-1">
              <span className="text-sm font-medium">Statut de la page</span>
              <NiceSelect<ProductForm["statuspage"]>
                value={form.statuspage}
                options={PAGE_OPTIONS}
                onChange={(v) => emit("statuspage", v)}
                display={(v) => (v === "none" ? "Aucune" : v.replace("-", " "))}
              />
            </label>
          );
        }
        return (
          <label key={key} className="flex flex-col gap-1">
            <span className="text-sm font-medium">Statut administrateur</span>
            <NiceSelect<ProductForm["vadmin"]>
              value={form.vadmin}
              options={ADMIN_OPTIONS}
              onChange={(v) => emit("vadmin", v)}
              display={(v) => v}
            />
          </label>
        );
      })}
    </section>
  );
}
