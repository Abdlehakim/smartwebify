// ───────────────────────────────────────────────────────────────
// src/app/manage-stock/brands/page.tsx
// ───────────────────────────────────────────────────────────────
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
import { FaRegEdit, FaTrashAlt, FaRegEye } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ───────── types ───────── */
type Status = "approve" | "not-approve";
const statusOptions: readonly Status[] = ["approve", "not-approve"] as const;

interface Brand {
  _id: string;
  reference: string;
  name: string;
  createdBy?: { username?: string };
  updatedBy?: { username?: string };
  createdAt: string;
  updatedAt: string;
  vadmin: Status;
}

const DEFAULT_PAGE_SIZE = 10;
const BREAKPOINT_QUERY = "(max-width: 1930px)";

/* ===================== NiceSelect (same style as Orders/Products) ===================== */
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

/* ===================== Page ===================== */
export default function BrandsClientPage() {
  /* data */
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  /* ui */
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  /* per-row saving */
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  /* delete popup */
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* responsive page size */
  useEffect(() => {
    const mql = window.matchMedia(BREAKPOINT_QUERY);
    const onChange = (e: MediaQueryListEvent) =>
      setPageSize(e.matches ? 7 : DEFAULT_PAGE_SIZE);
    setPageSize(mql.matches ? 7 : DEFAULT_PAGE_SIZE);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  /* fetch once */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { brands: data } = await fetchFromAPI<{ brands: Brand[] }>(
          "/dashboardadmin/stock/brands"
        );
        setBrands(data ?? []);
      } catch (err) {
        console.error("Failed to load brands:", err);
        setBrands([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* filtering + paging */
  const filtered = useMemo(
    () => brands.filter((b) => b.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [brands, searchTerm]
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

  /* API actions */
  const deleteBrand = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/stock/brands/delete/${id}`, {
      method: "DELETE",
    });
    setBrands((prev) => prev.filter((b) => b._id !== id));
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    setBrands((prev) => prev.map((b) => (b._id === id ? { ...b, vadmin: newStatus } : b)));
    setSaving((m) => ({ ...m, [id]: true }));
    try {
      await fetchFromAPI(`/dashboardadmin/stock/brands/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vadmin: newStatus }),
      });
    } catch {
      setBrands((prev) => [...prev]); // simple re-render; keep optimistic or store prev to revert
      alert("Échec de mise à jour du statut.");
    } finally {
      setSaving((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  };

  /* popup helpers */
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteBrand(id);
    } catch {
      alert("Échec de la suppression.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  const fmtUser = (u?: { username?: string }) => u?.username ?? "—";
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();

  /* ───────── render ───────── */
  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Marques</h1>
        <Link href="/dashboard/manage-stock/brands/create">
          <button className="btn-fit-white-outline">Créer une marque</button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche :</label>
          <input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="FilterInput"
            placeholder="Nom de la marque"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Sticky header (combined meta like Categories/Products) */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center border-r-4">Réf</th>
              <th className="px-4 py-2 text-center border-r-4">Nom</th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">Créé/MàJ par</th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">Créé/MàJ le</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable body */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucune marque trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((b, i) => (
                  <tr key={b._id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                    <td className="px-4 text-center">{b.reference}</td>
                    <td className="px-4 text-center font-semibold truncate">{b.name}</td>

                    {/* Combined author */}
                    <td className="px-4 text-center max-2xl:hidden">
                      {fmtUser(b.updatedBy) || fmtUser(b.createdBy)}
                    </td>

                    {/* Combined date */}
                    <td className="px-4 text-center max-2xl:hidden">
                      {fmtDate(b.updatedAt || b.createdAt)}
                    </td>

                    <td className="px-4 text-center">
                      <div className="flex justify-center items-center gap-2 h-8">
                        {/* Status selector */}
                        <NiceSelect<Status>
                          value={b.vadmin}
                          options={statusOptions}
                          onChange={(v) => updateStatus(b._id, v)}
                          className="h-8 py-0 leading-8 truncate"
                          disabled={!!saving[b._id]}
                          loading={!!saving[b._id]}
                        />

                        <Link href={`/dashboard/manage-stock/brands/update/${b._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[b._id]}>
                            <FaRegEdit size={14} />
                          </button>
                        </Link>

                        <Link href={`/dashboard/manage-stock/brands/voir/${b._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[b._id]}>
                            <FaRegEye size={14} />
                          </button>
                        </Link>

                        <button
                          onClick={() => openDelete(b._id, b.name)}
                          className="ButtonSquareDelete h-8"
                          aria-label="Supprimer la marque"
                          disabled={!!saving[b._id]}
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

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {!loading && (
        <div className="flex justify-center mt-6">
          <PaginationAdmin
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Popup */}
      {isDeleteOpen && (
        <Popup
          id={deleteId}
          name={deleteName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}

      {/* Mobile cards (consistent with other pages) */}
      <div className="md:hidden w-full">
        {displayed.length === 0 && !loading ? (
          <div className="py-6 text-center text-gray-600">Aucune marque trouvée.</div>
        ) : (
          <div className="space-y-3 w-full">
            {displayed.map((b, i) => (
              <div
                key={b._id}
                className={`rounded-md m-2 border border-primary/20 ${
                  i % 2 ? "bg-green-50" : "bg-white"
                } p-3 shadow-sm`}
              >
                {/* Header: name + actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold leading-tight truncate">{b.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Réf : {b.reference}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/manage-stock/brands/update/${b._id}`}>
                      <button className="ButtonSquare" disabled={!!saving[b._id]}>
                        <FaRegEdit size={14} />
                      </button>
                    </Link>
                    <Link href={`/dashboard/manage-stock/brands/voir/${b._id}`}>
                      <button className="ButtonSquare" disabled={!!saving[b._id]}>
                        <FaRegEye size={14} />
                      </button>
                    </Link>
                    <button
                      onClick={() => openDelete(b._id, b.name)}
                      className="ButtonSquareDelete"
                      disabled={!!saving[b._id]}
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </div>
                </div>

                {/* Meta (combined) */}
                <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                  <span>{b.updatedBy?.username || b.createdBy?.username || "—"}</span>
                  <span>{fmtDate(b.updatedAt || b.createdAt)}</span>
                </div>

                {/* Controls */}
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <NiceSelect<Status>
                    value={b.vadmin}
                    options={statusOptions}
                    onChange={(v) => updateStatus(b._id, v)}
                    className="w-full"
                    disabled={!!saving[b._id]}
                    loading={!!saving[b._id]}
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
