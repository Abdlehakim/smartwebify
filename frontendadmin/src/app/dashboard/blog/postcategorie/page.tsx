// ------------------------------------------------------------------
// src/app/dashboardadmin/blog/postCategorie/page.tsx
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
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";

/* ───────── types ───────── */
interface PostCategorie {
  _id: string;
  reference: string;
  name: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: Status;
}

const statusOptions = ["approve", "not-approve"] as const;
type Status = (typeof statusOptions)[number];

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
const PAGE_SIZE = 12;

export default function PostCategoriesClientPage() {
  const [items, setItems] = useState<PostCategorie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // État d'enregistrement par ligne (désactive les contrôles pendant la sauvegarde)
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // Delete popup
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [deleteName, setDeleteName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Fetch all post‐categories on mount
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const result = await fetchFromAPI<{ PostCategories: PostCategorie[] }>(
          "/dashboardadmin/blog/postcategorie"
        );
        setItems(result.PostCategories);
      } catch (err) {
        console.error("Failed to load post categories:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter + paginate
  const filtered = useMemo(
    () => items.filter((c) => c.name.toLowerCase().includes(searchTerm.toLowerCase())),
    [items, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  // Confirm delete from popup
  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await fetchFromAPI<void>(`/dashboardadmin/blog/postcategorie/delete/${id}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Impossible de supprimer la catégorie d’article.");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  // Update status
  const updateStatus = async (id: string, newStatus: Status) => {
    setItems((prev) => prev.map((c) => (c._id === id ? { ...c, vadmin: newStatus } : c)));
    setSaving((m) => ({ ...m, [id]: true }));
    try {
      await fetchFromAPI<void>(`/dashboardadmin/blog/postcategorie/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vadmin: newStatus }),
      });
    } catch {
      setItems((prev) => [...prev]); // simple re-render; (pour revert précis, garder l'ancien statut)
      alert("Échec de la mise à jour du statut.");
    } finally {
      setSaving((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  };

  // Delete popup handlers
  const openDelete = (id: string, name: string) => {
    setDeleteId(id);
    setDeleteName(name);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const fmtUser = (u?: { username?: string }) => u?.username ?? "—";
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
  const labelStatus = (s: Status) => (s === "approve" ? "Approuvée" : "Non approuvée");

  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Catégories d’articles</h1>
        <Link href="/dashboard/blog/postcategorie/create">
          <button className="btn-fit-white-outline">Créer une catégorie</button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label className="font-medium">Recherche :</label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="FilterInput"
            placeholder="Nom de la catégorie"
          />
        </div>
      </div>

      {/* Table + spinner */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Titre sticky */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center border-r-4">Réf</th>
              <th className="px-4 py-2 text-center border-r-4">Nom</th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">
                Créé/MàJ par
              </th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">
                Créé/MàJ le
              </th>
              <th className="px-4 py-2 text-center w-1/3">Actions</th>
            </tr>
          </thead>
        </table>

        {/* Corps scrollable */}
        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-600">
                    Aucune catégorie trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((c, i) => (
                  <tr key={c._id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                    <td className="px-4 text-center">{c.reference}</td>
                    <td className="px-4 text-center font-semibold truncate">{c.name}</td>
                    <td className="px-4 text-center max-2xl:hidden">
                      {fmtUser(c.updatedBy) || fmtUser(c.createdBy)}
                    </td>
                    <td className="px-4 text-center max-2xl:hidden">
                      {fmtDate(c.updatedAt || c.createdAt)}
                    </td>
                    <td className="px-4 text-center w-1/3">
                      <div className="flex justify-center items-center gap-2 h-8">
                        <NiceSelect<Status>
                          value={c.vadmin}
                          options={statusOptions}
                          onChange={(v) => updateStatus(c._id, v)}
                          display={labelStatus}
                          className="h-8 py-0 leading-8 truncate"
                          disabled={!!saving[c._id]}
                          loading={!!saving[c._id]}
                        />

                        <Link href={`/dashboard/blog/postcategorie/voir/${c._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[c._id]}>
                            <FaRegEye size={14} />
                          </button>
                        </Link>
                        <Link href={`/dashboard/blog/postcategorie/update/${c._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[c._id]}>
                            <FaRegEdit size={14} />
                          </button>
                        </Link>
                        <button
                          onClick={() => openDelete(c._id, c.name)}
                          className="ButtonSquareDelete h-8"
                          aria-label="Supprimer la catégorie d’article"
                          disabled={!!saving[c._id]}
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

          {/* overlay covers only the body region */}
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-green-50">
              <FaSpinner className="animate-spin text-3xl" />
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Delete popup */}
      {isDeleteOpen && (
        <Popup
          id={deleteId}
          name={deleteName}
          isLoading={isDeleting}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}
    </div>
  );
}
