// ------------------------------------------------------------------
// src/app/dashboard/blog/articles/page.tsx
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

/* ---------- types & constants ---------- */
interface BlogArticle {
  _id: string;
  title: string;
  reference: string;
  createdBy?: { username: string };
  updatedBy?: { username: string };
  createdAt: string;
  updatedAt: string;
  vadmin: Status;
}
const statusOptions = ["approve", "not-approve"] as const;
type Status = (typeof statusOptions)[number];

const PAGE_SIZE = 12;

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

/* ---------- component ---------- */
export default function ArticlesClientPage() {
  // data
  const [items, setItems] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // ui
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // per-row saving
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  // delete popup
  const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
  const [deleteId, setDeleteId] = useState<string>("");
  const [deleteTitle, setDeleteTitle] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /* ── fetch on mount ───────────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await fetchFromAPI<{ posts: BlogArticle[] }>(
          "/dashboardadmin/blog/post"
        );
        setItems(res.posts);
      } catch (err) {
        console.error("Failed to load posts:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ── filter & paginate ────────────────────────────────────────────── */
  const filtered = useMemo(
    () => items.filter((p) => p.title.toLowerCase().includes(searchTerm.toLowerCase())),
    [items, searchTerm]
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const displayed = useMemo(
    () => filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
    [filtered, currentPage]
  );

  /* ── CRUD helpers ─────────────────────────────────────────────────── */
  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await fetchFromAPI<void>(`/dashboardadmin/blog/post/delete/${id}`, {
        method: "DELETE",
      });
      setItems((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Suppression impossible.");
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
    }
  };

  const updateStatus = async (id: string, newStatus: Status) => {
    setItems((prev) => prev.map((p) => (p._id === id ? { ...p, vadmin: newStatus } : p)));
    setSaving((m) => ({ ...m, [id]: true }));
    try {
      await fetchFromAPI<void>(`/dashboardadmin/blog/post/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vadmin: newStatus }),
      });
    } catch {
      setItems((prev) => [...prev]); // simple re-render; to fully revert, keep a snapshot
      alert("Échec de la mise à jour du statut.");
    } finally {
      setSaving((m) => {
        const c = { ...m };
        delete c[id];
        return c;
      });
    }
  };

  const openDelete = (id: string, title: string) => {
    setDeleteId(id);
    setDeleteTitle(title);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const fmtUser = (u?: { username?: string }) => u?.username ?? "—";
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString();
  const labelStatus = (s: Status) => (s === "approve" ? "Approuvé" : "Non approuvé");

  /* ── render ───────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Header */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Articles</h1>
        <Link href="/dashboard/blog/articles/create">
          <button className="btn-fit-white-outline">Créer un article</button>
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
            placeholder="Titre"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* En-tête sticky (style unifié) */}
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              <th className="px-4 py-2 text-center border-r-4">Réf</th>
              <th className="px-4 py-2 text-center border-r-4">Titre</th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">Créé/MàJ par</th>
              <th className="px-4 py-2 text-center border-r-4 max-2xl:hidden">Créé/MàJ le</th>
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
                    Aucun article trouvé.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((p, i) => (
                  <tr key={p._id} className={i % 2 ? "bg-green-50" : "bg-white"}>
                    <td className="px-4 text-center">{p.reference}</td>
                    <td className="px-4 text-center font-semibold truncate">{p.title}</td>
                    <td className="px-4 text-center max-2xl:hidden">
                      {fmtUser(p.updatedBy) || fmtUser(p.createdBy)}
                    </td>
                    <td className="px-4 text-center max-2xl:hidden">
                      {fmtDate(p.updatedAt || p.createdAt)}
                    </td>
                    <td className="px-4 text-center w-1/3">
                      <div className="flex justify-center items-center gap-2 h-8">
                        {/* Statut (NiceSelect) */}
                        <NiceSelect<Status>
                          value={p.vadmin}
                          options={statusOptions}
                          onChange={(v) => updateStatus(p._id, v)}
                          display={labelStatus}
                          className="h-8 py-0 leading-8 truncate"
                          disabled={!!saving[p._id]}
                          loading={!!saving[p._id]}
                        />

                        <Link href={`/dashboard/blog/articles/voir/${p._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[p._id]}>
                            <FaRegEye size={14} />
                          </button>
                        </Link>

                        <Link href={`/dashboard/blog/articles/update/${p._id}`}>
                          <button className="ButtonSquare h-8" disabled={!!saving[p._id]}>
                            <FaRegEdit size={14} />
                          </button>
                        </Link>

                        <button
                          onClick={() => openDelete(p._id, p.title)}
                          className="ButtonSquareDelete h-8"
                          aria-label="Supprimer l’article"
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

          {/* overlay loading */}
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

      {/* Delete Popup */}
      {isDeleteOpen && (
        <Popup
          id={deleteId}
          name={deleteTitle}
          isLoading={isDeleting}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}

      {/* Cartes mobile */}
      <div className="md:hidden w-full">
        {displayed.length === 0 && !loading ? (
          <div className="py-6 text-center text-gray-600">Aucun article trouvé.</div>
        ) : (
          <div className="space-y-3 w-full">
            {displayed.map((p, i) => (
              <div
                key={p._id}
                className={`rounded-md m-2 border border-primary/20 ${
                  i % 2 ? "bg-green-50" : "bg-white"
                } p-3 shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold leading-tight truncate">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Réf : {p.reference}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/dashboard/blog/articles/voir/${p._id}`}>
                      <button className="ButtonSquare" disabled={!!saving[p._id]}>
                        <FaRegEye size={14} />
                      </button>
                    </Link>
                    <Link href={`/dashboard/blog/articles/update/${p._id}`}>
                      <button className="ButtonSquare" disabled={!!saving[p._id]}>
                        <FaRegEdit size={14} />
                      </button>
                    </Link>
                    <button
                      onClick={() => openDelete(p._id, p.title)}
                      className="ButtonSquareDelete"
                      disabled={!!saving[p._id]}
                    >
                      <FaTrashAlt size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-xs text-gray-600 flex items-center justify-between">
                  <span>{p.updatedBy?.username || p.createdBy?.username || "—"}</span>
                  <span>{fmtDate(p.updatedAt || p.createdAt)}</span>
                </div>

                <div className="mt-3 grid grid-cols-1 gap-2">
                  <NiceSelect<Status>
                    value={p.vadmin}
                    options={statusOptions}
                    onChange={(v) => updateStatus(p._id, v)}
                    display={labelStatus}
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
