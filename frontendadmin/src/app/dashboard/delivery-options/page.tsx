/* ------------------------------------------------------------------
   src/app/dashboard/manage-stock/delivery-options/page.tsx
------------------------------------------------------------------ */
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { FaRegEdit, FaTrashAlt, FaRegCopy } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ---------- types ---------- */
interface DeliveryOption {
  _id: string;
  name: string;
  price: number;
  estimatedDays: number;
  isActive: boolean;
  isPickup: boolean;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
}

/* ---------- constants ---------- */
const PAGE_SIZE = 12;
const BOOL_OPTIONS = ["true", "false"] as const;

/* ===================== NiceSelect (style unifié) ===================== */
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
export default function DeliveryOptionsPage() {
  const [options, setOptions] = useState<DeliveryOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState("");
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { deliveryOptions } =
          await fetchFromAPI<{ deliveryOptions: DeliveryOption[] }>(
            "/dashboardadmin/delivery-options/all"
          );
        setOptions(deliveryOptions);
      } catch (e) {
        console.error("Échec du chargement des options de livraison :", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(
    () => options.filter((o) => o.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [options, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  const updateField = async (
    id: string,
    field: "isActive" | "isPickup",
    value: boolean
  ) => {
    setSaving((m) => ({ ...m, [id]: true }));
    setOptions((prev) =>
      prev.map((o) => (o._id === id ? { ...o, [field]: value } : o))
    );
    try {
      await fetchFromAPI(`/dashboardadmin/delivery-options/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch {
      setOptions((prev) => [...prev]);
      alert(
        `Échec de la mise à jour de ${
          field === "isActive" ? "l’état d’activation" : "l’option retrait/livraison"
        }.`
      );
    } finally {
      setSaving((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  };

  const deleteOption = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/delivery-options/delete/${id}`, {
      method: "DELETE",
    });
    setOptions((prev) => prev.filter((o) => o._id !== id));
  };

  const copyToClipboard = (text: string) =>
    navigator.clipboard.writeText(text).catch(() => alert("Copie impossible."));

  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);
  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteOption(id);
    } catch {
      alert("Échec de la suppression.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* En-tête */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Options de livraison</h1>
        <Link href="/dashboard/delivery-options/create">
          <button className="btn-fit-white-outline">Ajouter une option</button>
        </Link>
      </div>

      {/* Recherche */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche :</label>
          <input
            className="FilterInput"
            placeholder="Nom"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* En-tête de tableau (MAJ : colonnes fusionnées Créé/MàJ) */}
      <table className="table-fixed w-full">
        <thead className="bg-primary text-white relative z-10">
          <tr className="text-sm">
            <th className="px-4 py-2 text-center border-r-4">ID</th>
            <th className="px-4 py-2 text-center border-r-4">Nom</th>
            <th className="px-4 py-2 text-center border-r-4">Créé/MàJ par</th>
            <th className="px-4 py-2 text-center border-r-4">Créé/MàJ le</th>
            <th className="px-4 py-2 text-center w-1/2">Action</th>
          </tr>
        </thead>
      </table>

      {/* Corps défilant */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
              {/* Aucun résultat */}
              {!loading && displayed.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucune option trouvée.
                  </td>
                </tr>
              )}

              {/* Lignes */}
              {displayed.map((o, i) => (
                <tr key={o._id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                  {/* ID tronqué + copier */}
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-1">
                      <span className="font-mono">{`${o._id.slice(0, 9)}…`}</span>
                      <button
                        onClick={() => copyToClipboard(o._id)}
                        className="hover:text-primary cursor-pointer"
                        title="Copier l’ID complet"
                        aria-label="Copier l’ID complet"
                        disabled={!!saving[o._id]}
                      >
                        <FaRegCopy size={14} />
                      </button>
                    </div>
                  </td>

                  {/* Nom */}
                  <td className="px-4 py-2 text-center font-semibold truncate">
                    {o.name}
                  </td>

                  {/* Créé/MàJ par (fusion) */}
                  <td className="px-4 py-2 text-center">
                    {o.updatedBy?.username || o.createdBy?.username || "—"}
                  </td>

                  {/* Créé/MàJ le (fusion) */}
                  <td className="px-4 py-2 text-center">
                    {new Date(o.updatedAt || o.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-2 w-1/2">
                    <div className="flex flex-wrap justify-center items-center gap-2">
                      {/* État d’activation */}
                      <NiceSelect<(typeof BOOL_OPTIONS)[number]>
                        value={o.isActive ? "true" : "false"}
                        options={BOOL_OPTIONS}
                        onChange={(v) => updateField(o._id, "isActive", v === "true")}
                        display={(v) => (v === "true" ? "Activée" : "Désactivée")}
                        disabled={!!saving[o._id]}
                        loading={!!saving[o._id]}
                      />

                      {/* Type : Retrait / Livraison */}
                      <NiceSelect<(typeof BOOL_OPTIONS)[number]>
                        value={o.isPickup ? "true" : "false"}
                        options={BOOL_OPTIONS}
                        onChange={(v) => updateField(o._id, "isPickup", v === "true")}
                        display={(v) => (v === "true" ? "Retrait" : "Livraison")}
                        disabled={!!saving[o._id]}
                        loading={!!saving[o._id]}
                      />

                      {/* Éditer / Supprimer */}
                      <Link href={`/dashboard/delivery-options/update/${o._id}`}>
                        <button className="ButtonSquare" disabled={!!saving[o._id]}>
                          <FaRegEdit size={14} />
                        </button>
                      </Link>
                      <button
                        onClick={() => openDelete(o._id, o.name)}
                        className="ButtonSquareDelete"
                        aria-label="Supprimer l’option"
                        disabled={!!saving[o._id]}
                      >
                        <FaTrashAlt size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Voile de chargement */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-6">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Popup suppression */}
      {isDeleteOpen && (
        <Popup
          id={deleteId}
          name={deleteName}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
