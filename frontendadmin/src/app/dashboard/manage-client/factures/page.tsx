// ------------------------------------------------------------------
// src/app/dashboard/manage-client/factures/page.tsx
// ------------------------------------------------------------------
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
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEye, FaTrashAlt, FaRegEdit } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import {
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiDownload,
  FiCalendar,
} from "react-icons/fi";
import { generatePdf } from "@/lib/generatePdf";
import PaginationAdmin from "@/components/PaginationAdmin";
import DateFilter, { DateRange } from "@/components/DateFilter";
import { saveAs } from "file-saver";

/* ---------- constants ---------- */
const API_ROOT = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
const ZIP_BASE = `${API_ROOT}/api/zip`;

/* ---------- utils ---------- */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

const fmtMoney = (amount: number, currency = "TND") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency }).format(
    amount ?? 0
  );

function makeProgressId(): string {
  if (
    typeof window !== "undefined" &&
    typeof window.crypto?.randomUUID === "function"
  ) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

const formatMonthLabel = (value: string, locale = "fr-FR") => {
  if (!value) return "Choisir un mois";
  const [y, m] = value.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return d.toLocaleDateString(locale, { month: "long", year: "numeric" });
};

/* ---------- types ---------- */
interface Facture {
  _id: string;
  ref: string;
  orderRef?: string;
  order?: string;
  clientName: string;
  status: "Paid" | "Cancelled";
  issuedAt?: string;
  createdAt: string;
  currency?: string;
  grandTotalTTC: number;
}
type StatusVal = "Paid" | "Cancelled";
type StringUnion = string;
type CounterDTO = { year: number; seq: number };

type ZipProgress = {
  done: number;
  total: number;
  failed: number;
  status: "running" | "done" | "error";
  message?: string;
};

type DeleteResp = {
  ok: boolean;
  deleted: number;
  invalidIds?: string[];
  notFoundIds?: string[];
  renumbered?: Array<{
    year: number;
    deletedSeqs: number[]; // e.g. [3] when FC-3-YYYY was deleted
    modified: number; // how many docs shifted in that year
    counterSeq: number; // new max seq for that year
  }>;
};

// Parse FC-<seq>-<year>
const parseRef = (ref?: string): { seq: number; year: number } | null => {
  if (!ref) return null;
  const m = /^FC-(\d+)-(\d+)$/.exec(ref);
  return m ? { seq: Number(m[1]), year: Number(m[2]) } : null;
};

// Apply backend renumber info locally (no refetch needed)
const applyRenumberLocally = (
  data: DeleteResp["renumbered"],
  currentMonth: string,
  setYearCounter: React.Dispatch<React.SetStateAction<CounterDTO | null>>,
  setFactures: React.Dispatch<React.SetStateAction<Facture[]>>
) => {
  if (!data?.length) return;

  setFactures((prev) =>
    prev.map((f) => {
      const info = parseRef(f.ref);
      if (!info) return f;

      // find matching year payload
      const y = data.find((r) => r.year === info.year);
      if (!y || !y.deletedSeqs?.length) return f;

      // how many deleted seqs are < this seq?
      const dec = y.deletedSeqs.reduce((n, s) => (s < info.seq ? n + 1 : n), 0);
      if (dec <= 0) return f;

      const newRef = `FC-${info.seq - dec}-${info.year}`;
      return { ...f, ref: newRef };
    })
  );

  const selectedYear = Number(currentMonth.slice(0, 4));
  const yr = data.find((r) => r.year === selectedYear);
  if (yr) {
    setYearCounter({ year: selectedYear, seq: yr.counterSeq });
  }
};

const pageSize = 8;

const statusOptions = [
  { value: "Paid", label: "Payée" },
  { value: "Cancelled", label: "Annulée" },
] as const;

/* ===================== French Month Popup (positioned under button) ===================== */

function MonthPopup({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState<number>(() => {
    const [y] = value.split("-").map(Number);
    return y || new Date().getFullYear();
  });

  const btnRef = useRef<HTMLButtonElement | null>(null);

  // position under the trigger and keep within viewport
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const gap = 8;
    const minWidth = 256;
    const width = Math.max(minWidth, b.width);

    let left = b.left;
    const maxLeft = window.innerWidth - width - 8;
    if (left > maxLeft) left = maxLeft;
    if (left < 8) left = 8;

    const top = Math.min(window.innerHeight - 8, b.bottom + gap);
    setPos({ top, left, width });
  };

  useLayoutEffect(() => {
    if (open) updatePos();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => updatePos();
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (btnRef.current?.contains(t)) return;
      if (t.closest("[data-month-popover]")) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const selectedMonthIndex = value
    ? Math.max(0, parseInt(value.split("-")[1] || "1", 10) - 1)
    : -1;

  const pick = (idx: number) => {
    const m = String(idx + 1).padStart(2, "0");
    onChange(`${year}-${m}`);
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setOpen(false);
  };

  const thisMonth = () => {
    const now = new Date();
    onChange(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    );
    setYear(now.getFullYear());
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="inline-flex min-w-[240px] justify-between items-center gap-3 rounded-md border
                   border-gray-300 bg-white px-3 py-2 text-sm text-slate-800
                   hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2 capitalize">
          <FiCalendar className="opacity-70" />
          {formatMonthLabel(value)}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="opacity-60"
        >
          <path
            d="M6 8l4 4 4-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            data-month-popover
            className="z-[1000] rounded-md border border-gray-300 bg-white shadow-lg p-2"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
          >
            {/* Header: year + nav */}
            <div className="flex items-center justify-between px-1 py-1">
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setYear((y) => y - 1)}
                aria-label="Année précédente"
              >
                <FiChevronLeft />
              </button>
              <div className="px-2 py-1 rounded bg-gray-100 text-sm font-medium tabular-nums">
                {year}
              </div>
              <button
                type="button"
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => setYear((y) => y + 1)}
                aria-label="Année suivante"
              >
                <FiChevronRight />
              </button>
            </div>

            {/* Grid of FR months */}
            <div className="grid grid-cols-4 gap-2 px-1 py-2">
              {[
                "janv",
                "févr",
                "mars",
                "avr",
                "mai",
                "juin",
                "juil",
                "août",
                "sept",
                "oct",
                "nov",
                "déc",
              ].map((m, idx) => {
                const isSelected =
                  idx === selectedMonthIndex &&
                  year === Number(value.slice(0, 4));
                return (
                  <button
                    key={m}
                    type="button"
                    className={`px-2 py-1 text-sm rounded border text-center
                        ${
                          isSelected
                            ? "border-primary bg-primary text-white"
                            : "border-gray-200 text-slate-700 hover:bg-gray-50"
                        }`}
                    onClick={() => pick(idx)}
                    aria-pressed={isSelected}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-1 pt-1 text-sm">
              <button
                type="button"
                className="text-slate-600 hover:underline"
                onClick={clear}
              >
                Effacer
              </button>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={thisMonth}
              >
                Ce mois-ci
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/* ===================== NiceSelect ===================== */
interface NiceSelectProps<T extends StringUnion> {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  display?: (v: T) => string;
  className?: string;
}
function NiceSelect<T extends StringUnion>({
  value,
  options,
  onChange,
  display,
  className = "",
}: NiceSelectProps<T>) {
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

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
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as Node;
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

  const label = display ? display(value) : String(value);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((s) => !s)}
        className={`min-w-[150px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
                    bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100
                    focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{label}</span>
        <FiChevronDown className="shrink-0" />
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
              className="rounded-md border border-emerald-200 bg-white shadow-lg max-h-60 overflow-auto"
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
                      ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-700"
                      }
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
                        ${
                          isActive
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-300 text-transparent"
                        }`}
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

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [bulkZipDownloading, setBulkZipDownloading] = useState(false);
  const [zipProgress, setZipProgress] = useState<ZipProgress | null>(null);
  const esRef = useRef<EventSource | null>(null);

  // counter edit state
  const [yearCounter, setYearCounter] = useState<CounterDTO | null>(null);
  const [counterSaving, setCounterSaving] = useState(false);

  useEffect(() => {
    return () => {
      try {
        esRef.current?.close();
      } catch {}
    };
  }, []);

  const filtered = useMemo(
    () =>
      factures
        .filter(
          (f) =>
            !filterStatus || f.status === (filterStatus as Facture["status"])
        )
        .filter((f) => {
          const q = searchTerm.trim().toLowerCase();
          if (!q) return true;
          return (
            f.ref.toLowerCase().includes(q) ||
            (f.orderRef ?? "").toLowerCase().includes(q) ||
            f.clientName.toLowerCase().includes(q)
          );
        })
        .filter((f) => {
          if (!dateRange) return true;
          const d = new Date(f.issuedAt ?? f.createdAt);
          return d >= dateRange.start && d <= dateRange.end;
        }),
    [factures, filterStatus, searchTerm, dateRange]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const displayed = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  useEffect(() => {
    (async () => {
      try {
        const { factures } = await fetchFromAPI<{ factures: Facture[] }>(
          "/dashboardadmin/factures"
        );
        setFactures(factures ?? []);
      } catch (err) {
        console.error("Fetch factures error:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const y = Number(month.slice(0, 4));
    if (!Number.isFinite(y)) return;

    (async () => {
      try {
        const data = await fetchFromAPI<CounterDTO>(
          `/dashboardadmin/factures/counter/${y}`
        );
        setYearCounter({ year: y, seq: data?.seq ?? 0 });
      } catch {
        setYearCounter({ year: y, seq: 0 });
      }
    })();
  }, [month]);

  const saveCounter = async () => {
    if (!yearCounter) return;
    try {
      setCounterSaving(true);
      const y = yearCounter.year;
      await fetchFromAPI(`/dashboardadmin/factures/counter/${y}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seq: Number(yearCounter.seq) || 0 }),
      });
    } catch (err) {
      console.error("saveCounter failed:", err);
      alert("Échec de la mise à jour du compteur.");
    } finally {
      setCounterSaving(false);
    }
  };

  const updateStatus = async (id: string, status: StatusVal) => {
    try {
      await fetchFromAPI(`/dashboardadmin/factures/updateStatus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setFactures((prev) =>
        prev.map((f) => (f._id === id ? ({ ...f, status } as Facture) : f))
      );
    } catch (err) {
      console.error("Update facture status error ▶", err);
      alert("Échec de la mise à jour du statut de la facture.");
    }
  };

  const downloadInvoice = async (f: Facture) => {
    if (downloadingId) return;
    if (!f.ref) {
      alert("Référence de facture manquante.");
      return;
    }
    try {
      setDownloadingId(f._id);
      await generatePdf(
        `/pdf/invoice/${encodeURIComponent(f.ref)}`,
        `FACTURE-${f.ref}.pdf`
      );
    } catch (e) {
      console.error(e);
      alert("Échec du téléchargement de la facture.");
    } finally {
      setDownloadingId(null);
    }
  };

  const deleteOne = async (id: string) => {
    const target = factures.find((f) => f._id === id);
    const label = target?.ref ? ` (${target.ref})` : "";
    const ok = window.confirm(`Supprimer définitivement la facture${label} ?`);
    if (!ok) return;

    const prev = factures;
    setFactures((f) => f.filter((x) => x._id !== id));
    try {
      const res = await fetchFromAPI<DeleteResp>(
        "/dashboardadmin/factures/delete",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [id] }),
        }
      );

      if (!res?.ok) {
        setFactures(prev);
        alert("La suppression n’a pas abouti.");
      } else {
        // 🔥 adjust refs locally based on backend renumbering info
        applyRenumberLocally(
          res.renumbered,
          month,
          setYearCounter,
          setFactures
        );
      }
    } catch (err) {
      console.error("Delete one error:", err);
      setFactures(prev);
      alert("Échec de la suppression.");
    }
  };

  // bulk ZIP download with SSE progress
  const downloadMonthZip = async () => {
    if (!month) return;

    try {
      esRef.current?.close();
    } catch {}
    esRef.current = null;
    setZipProgress(null);

    const progressId = makeProgressId();

    // 1) open SSE for progress
    try {
      const es = new EventSource(
        `${ZIP_BASE}/invoices/progress/${progressId}`,
        { withCredentials: true }
      );
      es.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data) as ZipProgress;
          setZipProgress(data);
          if (data.status !== "running") {
            es.close();
            esRef.current = null;
          }
        } catch {}
      };
      es.onerror = () => {
        try {
          es.close();
        } catch {}
        esRef.current = null;
      };
      esRef.current = es;
    } catch {}

    // 2) kick off the download request with the same progressId
    setBulkZipDownloading(true);
    try {
      const url = `${ZIP_BASE}/invoices/zip?month=${encodeURIComponent(month)}${
        filterStatus ? `&status=${encodeURIComponent(filterStatus)}` : ""
      }&progressId=${encodeURIComponent(progressId)}`;

      const res = await fetch(url, {
        credentials: "include",
        headers: { Accept: "application/zip" },
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`ZIP failed (${res.status}) ${msg.slice(0, 300)}`);
      }

      const blob = await res.blob();
      const cd =
        res.headers.get("Content-Disposition") ||
        res.headers.get("content-disposition");
      let filename = `FACTURES-${month}.zip`;
      const m = cd && /filename="?([^"]+)"?/.exec(cd);
      if (m?.[1]) filename = m[1];

      saveAs(blob, filename);
    } catch (e) {
      console.error(e);
      alert("Échec lors de la création/téléchargement du ZIP.");
    } finally {
      setBulkZipDownloading(false);
      setTimeout(() => {
        try {
          esRef.current?.close();
        } catch {}
        esRef.current = null;
      }, 5000);
    }
  };

  const running = bulkZipDownloading || zipProgress?.status === "running";

  return (
    <div className="mx-auto px-4 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      {/* Header with month selector + ZIP button (factures only) */}
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Factures</h1>
        <div className="flex items-end gap-2">
          <div className="flex flex-col">
            <MonthPopup value={month} onChange={setMonth} />
          </div>

          {/* Yearly SEQ editor */}
          <div className="flex items-center gap-2">
            <label className="text-xs opacity-70">
              SEQ {month.slice(0, 4)} :
            </label>
            <input
              type="number"
              min={0}
              className="FilterInput w-24"
              value={yearCounter?.seq ?? ""}
              onChange={(e) =>
                setYearCounter({
                  year: Number(month.slice(0, 4)),
                  seq: Number(e.target.value) || 0,
                })
              }
            />
            <button
              onClick={saveCounter}
              disabled={counterSaving || !yearCounter}
              className="btn-fit-white-outline"
            >
              {counterSaving ? (
                <FaSpinner className="animate-spin" />
              ) : (
                "Enregistrer"
              )}
            </button>
          </div>
          {/* ZIP button with ghost width reservation */}
          <button
            onClick={downloadMonthZip}
            disabled={running}
            className="inline-grid grid-cols-1 grid-rows-1 place-items-center whitespace-nowrap tabular-nums
                       rounded-md border border-primary px-3 py-2 text-sm text-primary
                       hover:bg-primary hover:text-white disabled:opacity-60 cursor-pointer bg-white"
            title="Télécharger un ZIP avec toutes les factures du mois"
            aria-busy={running}
          >
            {/* visible */}
            <span className="col-start-1 row-start-1 inline-flex items-center gap-2">
              {running ? (
                <>
                  <FaSpinner className="animate-spin" />
                  {zipProgress?.total ? (
                    <>
                      Zippage… {zipProgress.done}/{zipProgress.total}
                      {zipProgress.failed
                        ? ` (échouées: ${zipProgress.failed})`
                        : ""}
                    </>
                  ) : (
                    <>Zippage…</>
                  )}
                </>
              ) : (
                <>
                  <FiDownload />
                  ZIP des factures
                </>
              )}
            </span>
            {/* ghost (reserves width) */}
            <span
              aria-hidden="true"
              className="col-start-1 row-start-1 invisible inline-flex items-center gap-2"
            >
              <FaSpinner />
              Zippage… 000/000 (échouées: 000)
            </span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="searchFacture" className="font-medium">
            Rechercher :
          </label>
          <input
            id="searchFacture"
            className="FilterInput"
            placeholder="Réf, commande ou client"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <label className="font-medium">Filtrer par date :</label>
            <DateFilter
              onChange={(range) => {
                setDateRange(range);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="statusFilter" className="font-medium">
              Filtrer par statut :
            </label>
            <select
              id="statusFilter"
              className="FilterInput"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">Tous les statuts</option>
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <table className="table-fixed w-full">
          <thead className="bg-primary text-white relative z-10">
            <tr className="text-sm">
              {/* ✅ header checkbox */}
              <th className="px-4 py-2 text-center border-r-4">Date</th>
              <th className="px-4 py-2 text-center border-r-4">Référence</th>
              <th className="px-4 py-2 text-center border-r-4">Commande</th>
              <th className="px-4 py-2 text-center border-r-4">Client</th>
              <th className="px-4 py-2 text-center border-r-4">Total TTC</th>
              <th className="px-4 py-2 text-center border-r-4">Statut</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayed.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-600">
                    Aucune facture trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayed.map((f) => {
                  const isRowDownloading = downloadingId === f._id;
                  return (
                    <tr key={f._id} className="even:bg-white odd:bg-green-50">
                      <td className="px-4 text-center">
                        {fmtDate(f.issuedAt ?? f.createdAt)}
                      </td>
                      <td className="px-4 text-center truncate font-semibold">
                        {f.ref}
                      </td>
                      <td className="px-4 text-center truncate">
                        {f.orderRef ?? "—"}
                      </td>
                      <td className="px-4 text-center truncate">
                        {f.clientName}
                      </td>
                      <td className="px-4 text-center">
                        {fmtMoney(f.grandTotalTTC, f.currency ?? "TND")}
                      </td>
                      <td className="px-4 text-center">
                        <NiceSelect<StatusVal>
                          value={f.status}
                          options={statusOptions.map((s) => s.value)}
                          onChange={(v) => updateStatus(f._id, v)}
                          display={(v) =>
                            statusOptions.find((s) => s.value === v)?.label ?? v
                          }
                          className="mx-auto"
                        />
                      </td>
                      <td className="px-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          {f.order && (
                            <Link
                              href={`/dashboard/manage-client/orders/update/${f.order}`}
                            >
                              <button
                                className="ButtonSquare"
                                title="Modifier la commande liée"
                                aria-label="Modifier la commande liée"
                              >
                                <FaRegEdit size={14} />
                              </button>
                            </Link>
                          )}
                          <Link
                            href={`/dashboard/manage-client/factures/voir/${f._id}`}
                          >
                            <button
                              className="ButtonSquare"
                              aria-label="Voir la facture"
                            >
                              <FaRegEye size={14} />
                            </button>
                          </Link>
                          <button
                            onClick={() => downloadInvoice(f)}
                            disabled={isRowDownloading}
                            className="ButtonSquare disabled:opacity-60"
                            title="Télécharger la facture"
                            aria-label="Télécharger la facture"
                            aria-busy={isRowDownloading}
                          >
                            {isRowDownloading ? (
                              <FaSpinner className="animate-spin" size={14} />
                            ) : (
                              <FiDownload size={14} />
                            )}
                          </button>

                          <button
                            onClick={() => deleteOne(f._id)}
                            className="ButtonSquareDelete"
                            title="Supprimer la facture"
                            aria-label="Supprimer la facture"
                          >
                            <FaTrashAlt size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
      <div className="flex justify-center mt-4">
        <PaginationAdmin
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
