// ------------------------------------------------------------------
// src/app/dashboard/manage-stock/products/page.tsx
// ------------------------------------------------------------------
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { FaRegEdit, FaRegEye, FaTrashAlt } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import {
  STOCK_OPTIONS,
  PAGE_OPTIONS,
  ADMIN_OPTIONS,
  StockStatus,
  StatusPage,
  Vadmin,
} from "@/constants/product-options";

interface Product {
  _id: string;
  reference: string;
  name: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: Vadmin;
  stockStatus: StockStatus;
  statuspage: StatusPage;
}

const DEFAULT_PAGE_SIZE = 10;
const BREAKPOINT_QUERY = "(max-width: 1930px)";

/* ===================== NiceSelect (same style/UX as Orders page) ===================== */
type StringUnion = string;
interface NiceSelectProps<T extends StringUnion> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  display?: (v: T) => string;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}
function NiceSelect<T extends StringUnion>({
  value,
  options,
  onChange,
  display,
  className = "",
  disabled = false,
  loading = false,
}: NiceSelectProps<T>) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    setPos({ top: b.bottom + 4, left: b.left, width: b.width });
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (evt: MouseEvent) => {
      const t = evt.target as Node;
      if (btnRef.current?.contains(t)) return;
      if ((t as HTMLElement).closest("[data-nice-select-root]")) return;
      setOpen(false);
    };
    const onMove = () => updatePos();
    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  useEffect(() => {
    if (disabled || loading) setOpen(false);
  }, [disabled, loading]);

  const label = display ? display(value) : String(value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (disabled || loading) return;
          setOpen((s) => !s);
        }}
        className={`min-w-[160px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
                    ${disabled || loading ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
                    ${disabled || loading ? "bg-emerald-50 text-emerald-800" : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"}
                    border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || loading}
        disabled={disabled || loading}
      >
        <span className="truncate">{label}</span>
        {loading ? <FaSpinner className="animate-spin shrink-0" /> : <FiChevronDown className="shrink-0" />}
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            data-nice-select-root
            className="fixed z-[1000]"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div
              className="rounded-md border bg-white shadow-lg max-h-60 overflow-auto border-emerald-200"
              role="listbox"
            >
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
                      setOpen(false);
                      onChange(opt);
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

export default function ProductsClientPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // per-product saving state (disables selects/buttons to match Orders UX)
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT_QUERY);
    const onChange = (e: MediaQueryListEvent) =>
      setPageSize(e.matches ? 7 : DEFAULT_PAGE_SIZE);

    setPageSize(mql.matches ? 7 : DEFAULT_PAGE_SIZE);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { products } = await fetchFromAPI<{ products: Product[] }>(
          "/dashboardadmin/stock/products"
        );
        setProducts(products);
      } catch (err) {
        console.error("Failed to load products:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [products, searchTerm]
  );

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize]
  );

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const safePage = Math.min(currentPage, totalPages);
  const displayed = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  async function updateField<K extends keyof Product>(id: string, key: K, value: Product[K]) {
    // optimistic UI
    setProducts((prev) => prev.map((p) => (p._id === id ? { ...p, [key]: value } : p)));
    setSaving((m) => ({ ...m, [id]: true }));
    try {
      await fetchFromAPI(`/dashboardadmin/stock/products/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      // trigger re-render; (if you want true revert, we can store prev value)
      setProducts((prev) => [...prev]);
      alert(`Échec de mise à jour du champ ${String(key)}.`);
    } finally {
      setSaving((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  }

  async function deleteProduct(id: string) {
    await fetchFromAPI(`/dashboardadmin/stock/products/delete/${id}`, {
      method: "DELETE",
    });
    setProducts((prev) => prev.filter((p) => p._id !== id));
  }

  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    await deleteProduct(id);
    setDeleteLoading(false);
    closeDelete();
  };

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Header row */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Produits</h1>

        <Link href="/dashboard/manage-stock/products/create">
          <button className="btn-fit-white-outline">Créer un produit</button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche :</label>
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Nom du produit"
            className="FilterInput"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky header table (like Orders) */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center border-r-4">Réf</th>
              <th className="px-4 py-2 text-center border-r-4">Nom</th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">Créé/MàJ par</th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">Créé/MàJ le</th>
              <th className="px-4 py-2 text-center w-1/2">Actions</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          {/* Body table */}
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucun produit trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((p, i) => (
                  <tr key={p._id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                    <td className="px-4 text-center">{p.reference}</td>
                    <td className="px-4 text-center font-semibold truncate">{p.name}</td>
                    <td className="px-4 text-center max-2xl:hidden">
                      {p.updatedBy?.username || p.createdBy?.username || "—"}
                    </td>
                    <td className="px-4 text-center max-2xl:hidden">
                      {new Date(p.updatedAt || p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 text-center w-1/2">
                      <div className="flex justify-center items-center gap-2 h-8">
                        <NiceSelect<Vadmin>
                          value={p.vadmin}
                          options={ADMIN_OPTIONS as readonly Vadmin[]}
                          onChange={(v) => updateField(p._id, "vadmin", v)}
                          className="h-8 py-0 leading-8 truncate"
                          disabled={!!saving[p._id]}
                          loading={!!saving[p._id]}
                        />

                        <NiceSelect<StockStatus>
                          value={p.stockStatus}
                          options={STOCK_OPTIONS as readonly StockStatus[]}
                          onChange={(v) => updateField(p._id, "stockStatus", v)}
                          className="h-8 py-0 leading-8 truncate"
                          disabled={!!saving[p._id]}
                          loading={!!saving[p._id]}
                        />

                        <NiceSelect<StatusPage>
                          value={p.statuspage}
                          options={PAGE_OPTIONS as readonly StatusPage[]}
                          onChange={(v) => updateField(p._id, "statuspage", v)}
                          display={(v) => (v === "none" ? "Aucune" : v.replace("-", " "))}
                          className="h-8 py-0 leading-8 truncate"
                          disabled={!!saving[p._id]}
                          loading={!!saving[p._id]}
                        />

                        <Link href={`/dashboard/manage-stock/products/update/${p._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[p._id]}>
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <Link href={`/dashboard/manage-stock/products/voir/${p._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[p._id]}>
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(p._id, p.name)}
                          className="ButtonSquareDelete h-8"
                          aria-label="Supprimer le produit"
                          disabled={!!saving[p._id]}
                        >
                          <FaTrashAlt size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            )}
          </table>

          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex justify-center mt-4">
          <PaginationAdmin
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete modal */}
      {isDeleteOpen && (
        <Popup
          id={deleteId}
          name={deleteName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}

      {/* Mobile cards (kept, with green theme + consistent borders) */}
      <div className="md:hidden w-full">
        {displayed.length === 0 && !loading ? (
          <div className="py-6 text-center text-gray-600">Aucun produit trouvé.</div>
        ) : (
          <div className="space-y-3 w-full">
            {displayed.map((p, i) => (
              <div
                key={p._id}
                className={`rounded-md m-2 border border-primary/20 ${
                  i % 2 ? "bg-green-50" : "bg-white"
                } p-3 shadow-sm`}
              >
                {/* Header: name + actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold leading-tight truncate">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Réf : {p.reference}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/manage-stock/products/update/${p._id}`}>
                      <button className="ButtonSquare" disabled={!!saving[p._id]}>
                        <FaRegEdit size={14} />
                      </button>
                    </Link>
                    <Link href={`/dashboard/manage-stock/products/voir/${p._id}`}>
                      <button className="ButtonSquare" disabled={!!saving[p._id]}>
                        <FaRegEye size={14} />
                      </button>
                    </Link>
                    <button
                      onClick={() => openDelete(p._id, p.name)}
                      className="ButtonSquareDelete"
                      disabled={!!saving[p._id]}
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                  <span>{p.updatedBy?.username || p.createdBy?.username || "—"}</span>
                  <span>{new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</span>
                </div>

                {/* Controls */}
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <NiceSelect<Vadmin>
                    value={p.vadmin}
                    options={ADMIN_OPTIONS as readonly Vadmin[]}
                    onChange={(v) => updateField(p._id, "vadmin", v)}
                    className="w-full"
                    disabled={!!saving[p._id]}
                    loading={!!saving[p._id]}
                  />
                  <NiceSelect<StockStatus>
                    value={p.stockStatus}
                    options={STOCK_OPTIONS as readonly StockStatus[]}
                    onChange={(v) => updateField(p._id, "stockStatus", v)}
                    className="w-full"
                    disabled={!!saving[p._id]}
                    loading={!!saving[p._id]}
                  />
                  <NiceSelect<StatusPage>
                    value={p.statuspage}
                    options={PAGE_OPTIONS as readonly StatusPage[]}
                    onChange={(v) => updateField(p._id, "statuspage", v)}
                    display={(v) => (v === "none" ? "Aucune" : v.replace("-", " "))}
                    className="w-full"
                    disabled={!!saving[p._id]}
                    loading={!!saving[p._id]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
