// ------------------------------------------------------------------
// src/app/dashboard/manage-client/orders/page.tsx
// ------------------------------------------------------------------
"use client";

import React, {
  useEffect,
  useMemo,
  useState,
  useRef,
  useLayoutEffect,
  useCallback,
} from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { FaRegEye, FaTrashAlt, FaRegEdit } from "react-icons/fa";
import { FaSpinner } from "react-icons/fa6";
import { FiChevronDown, FiCheck, FiXCircle } from "react-icons/fi";
import PaginationAdmin from "@/components/PaginationAdmin";
import Popup from "@/components/Popup/DeletePopup";
import ErrorPopup from "@/components/Popup/ErrorPopup";
import DateFilter, { DateRange } from "@/components/DateFilter";

/* ----------------------------- utils ----------------------------- */
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

/** Format remaining time nicely (e.g. "~1.5 h" or "8 min"). */
function remainText(
  etaISO?: string,
  snapMsLeft?: number,
  now: number = Date.now()
) {
  if (!etaISO && typeof snapMsLeft !== "number") return "";
  const eta = etaISO ? new Date(etaISO).getTime() : now + (snapMsLeft ?? 0);
  const left = Math.max(0, eta - now);
  const hours = left / 3_600_000;
  if (hours >= 1) return `~${hours.toFixed(1)} h`;
  const mins = Math.ceil(left / 60_000);
  return `${mins} min`;
}

/* Time we optimistically expect the worker to delay before creating the facture */
const DEFAULT_INVOICE_DELAY_MS = Number(
  process.env.NEXT_PUBLIC_INVOICE_DELAY_MS ?? 190000
);

/* Persist pendingMap across refreshes */
const PENDING_STORAGE_KEY = "pendingMap:v1";

/* ----------------------------- types ----------------------------- */
interface Order {
  _id: string;
  ref: string;
  clientName: string;
  user: { _id: string; username?: string; email: string } | null;
  pickupMagasin: Array<{ Magasin: string; MagasinAddress: string }>;
  createdAt: string;
  orderStatus: string;
  deliveryMethod: string;
  deliveryCost?: number;
  DeliveryAddress: Array<{ Address: string; DeliverToAddress: string }>;
  Invoice?: boolean;
}

type PendingInfo = {
  orderId: string;
  etaISO?: string; // normalized ETA (ISO)
  msLeft?: number; // initial ms left (optional)
  source?: "optimistic" | "server";
};

type PendingAPI = {
  orderId: string;
  etaISO?: string;
  eta?: string;
  msLeft?: number;
  delay?: number;
};

const pageSize = 8;

const statusOptions = [
  { value: "Processing", label: "En cours" },
  { value: "Shipped", label: "Expédiée" },
  { value: "Delivered", label: "Livrée" },
  { value: "Pickup", label: "Retrait en magasin" },
  { value: "Cancelled", label: "Annulée" },
  { value: "Refunded", label: "Remboursée" },
] as const;

type StatusVal = (typeof statusOptions)[number]["value"];

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

/* ===================== NiceSelect ===================== */
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
        className={`min-w-[200px] inline-flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm font-medium
                    border-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 ${className} ${
          disabled || loading
            ? "bg-emerald-50 text-emerald-800 opacity-60 cursor-not-allowed"
            : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || loading}
        disabled={disabled || loading}
      >
        <span className="truncate">{label}</span>
        {loading ? (
          <FaSpinner className="animate-spin shrink-0" />
        ) : (
          <FiChevronDown className="shrink-0" />
        )}
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
                      ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-700"
                      }
                      hover:bg-emerald-100 hover:text-emerald-800`}
                    onClick={() => {
                      setOpen(false); // close immediately on selection
                      onChange(opt);
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

/* ===================== Page ===================== */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState("");
  const [deleteOrderRef, setDeleteOrderRef] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Local (transient) spinner while we create/poll
  const [pendingInvoiceLocal, setPendingInvoiceLocal] = useState<
    Record<string, boolean>
  >({});
  // Scheduled jobs (BullMQ delayed) with ETA for countdown (merge optimistic+server)
  const [pendingMap, setPendingMap] = useState<Record<string, PendingInfo>>({});
  const [canceling, setCanceling] = useState<Record<string, boolean>>({});
  const [confirming, setConfirming] = useState<Record<string, boolean>>({});

  const [now, setNow] = useState<number>(() => Date.now());

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<Record<string, boolean>>({});

  const aliveRef = useRef(true);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /* ------------ fetch orders ------------ */
  const filteredOrders = useMemo(
    () =>
      orders
        .filter((o) => !filterStatus || o.orderStatus === filterStatus)
        .filter((o) => o.ref.toLowerCase().includes(searchTerm.toLowerCase()))
        .filter((o) => {
          if (!dateRange) return true;
          const d = new Date(o.createdAt);
          return d >= dateRange.start && d <= dateRange.end;
        }),
    [orders, filterStatus, searchTerm, dateRange]
  );

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const displayedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage]);

  useEffect(() => {
    aliveRef.current = true;
    (async () => {
      try {
        const { orders } = await fetchFromAPI<{ orders: Order[] }>(
          "/dashboardadmin/orders"
        );
        if (!aliveRef.current) return;
        setOrders(orders);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Fetch orders failed:", msg);
      } finally {
        if (aliveRef.current) setLoading(false);
      }
    })();
    return () => {
      aliveRef.current = false;
    };
  }, []);

  /* ------------ hydrate pendingMap from sessionStorage on first mount ------------ */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Record<string, PendingInfo>;
        if (saved && typeof saved === "object") {
          setPendingMap((prev) => ({ ...saved, ...prev }));
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  /* keep sessionStorage in sync */
  useEffect(() => {
    try {
      if (Object.keys(pendingMap).length) {
        sessionStorage.setItem(PENDING_STORAGE_KEY, JSON.stringify(pendingMap));
      } else {
        sessionStorage.removeItem(PENDING_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [pendingMap]);

  /* ------------ helpers to normalize & merge pending lists ------------ */
  const normalizePending = useCallback(
    (list: PendingAPI[]): Record<string, PendingInfo> => {
      const map: Record<string, PendingInfo> = {};
      (list ?? []).forEach((p) => {
        if (!p?.orderId) return;
        const etaISO = p.etaISO ?? p.eta;
        const msL = typeof p.msLeft === "number" ? p.msLeft : p.delay;
        map[p.orderId] = {
          orderId: p.orderId,
          etaISO,
          msLeft: msL,
          source: "server",
        };
      });
      return map;
    },
    []
  );

  /** Merge server results into the existing map, never blindly replacing optimistic entries. */
  const mergeIntoPendingMap = useCallback(
    (incomingList: PendingAPI[]) => {
      const serverMap = normalizePending(incomingList);
      setPendingMap((prev) => {
        const next: Record<string, PendingInfo> = { ...prev };
        // Upsert all server entries (server truth overrides optimistic)
        Object.keys(serverMap).forEach((k) => {
          next[k] = serverMap[k];
        });
        return next;
      });
    },
    [normalizePending, setPendingMap]
  );

  /** Occasionally prune optimistic entries that have expired (in case scheduling failed). */
  const pruneExpiredOptimistic = useCallback(() => {
    setPendingMap((prev) => {
      const nowTs = Date.now();
      const next: Record<string, PendingInfo> = {};
      for (const [k, v] of Object.entries(prev)) {
        const eta = v.etaISO
          ? new Date(v.etaISO).getTime()
          : nowTs + (v.msLeft ?? 0);
        // Keep if still in the future, or if it's confirmed by server
        if (eta > nowTs || v.source === "server") next[k] = v;
      }
      return next;
    });
  }, [setPendingMap]);

  /* ------------ load pending scheduled list + keep ticking countdown ------------ */
  const refreshPendingOnce = async (merge = true) => {
    try {
      const res = await fetchFromAPI<{
        pending: PendingAPI[];
      }>("/dashboardadmin/factures/pending");
      if (merge) {
        mergeIntoPendingMap(res.pending ?? []);
      } else {
        setPendingMap(normalizePending(res.pending ?? []));
      }
    } catch (e) {
      console.warn("refreshPendingOnce failed:", e);
    }
  };

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await fetchFromAPI<{ pending: PendingAPI[] }>(
          "/dashboardadmin/factures/pending"
        );
        if (!mounted) return;
        // IMPORTANT: merge instead of replace to avoid wiping optimistic entries
        mergeIntoPendingMap(res.pending ?? []);
      } catch (e) {
        console.warn("pending scheduled fetch failed:", e);
      }
    };

    load();
    const poll = setInterval(load, 15000); // keep in sync with server
    const tick = setInterval(() => {
      setNow(Date.now()); // live countdown
      pruneExpiredOptimistic(); // cleanup stale optimistic entries
    }, 1000);
    return () => {
      mounted = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [mergeIntoPendingMap, pruneExpiredOptimistic]);

  const setOrderStatus = async (id: string, status: StatusVal) => {
    setSavingStatus((p) => ({ ...p, [id]: true }));
    try {
      await fetchFromAPI(`/dashboardadmin/orders/updateStatus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, orderStatus: status } : o))
      );
    } catch {
      alert("Échec de la mise à jour du statut.");
    } finally {
      setSavingStatus((p) => {
        const c = { ...p };
        delete c[id];
        return c;
      });
    }
  };

  // replace your existing cancelScheduled with this
  const cancelScheduled = async (
    orderId: string,
    silent = false,
    alsoCancelOrder = false
  ) => {
    try {
      setCanceling((m) => ({ ...m, [orderId]: true }));
      await fetchFromAPI(`/dashboardadmin/factures/pending/${orderId}`, {
        method: "DELETE",
      });

      // Remove pending entry so the Annuler button disappears immediately
      setPendingMap((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });

      // If requested, also change order status to "Cancelled" (label "Annulée")
      if (alsoCancelOrder) {
        await setOrderStatus(orderId, "Cancelled");
      }
    } catch {
      if (!silent) alert("Échec de l'annulation de la facture planifiée.");
    } finally {
      setCanceling((m) => {
        const c = { ...m };
        delete c[orderId];
        return c;
      });
    }
  };

  const confirmAndCreate = async (orderId: string) => {
    setConfirming((m) => ({ ...m, [orderId]: true }));
    try {
      // Cancel delayed job quietly (ok if none)
      await cancelScheduled(orderId, true, false);

      // Remove pending entry in UI
      setPendingMap((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });

      // Create the invoice now
      await createInvoiceFromOrder(orderId);
      // createInvoiceFromOrder sets Invoice=true in orders state on success
    } catch {
      alert("Échec de la création immédiate de la facture.");
    } finally {
      setConfirming((m) => {
        const c = { ...m };
        delete c[orderId];
        return c;
      });
    }
  };

  /* ------------ CRUD helpers ------------ */
  const deleteOrder = async (id: string) => {
    await fetchFromAPI(`/dashboardadmin/orders/${id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o._id !== id));
    setPendingMap((prev) => {
      const c = { ...prev };
      delete c[id];
      return c;
    });
  };

  // Poll an order until backend marks Invoice=true (fallback path)
  const pollInvoice = async (orderId: string) => {
    setPendingInvoiceLocal((prev) => ({ ...prev, [orderId]: true }));
    try {
      let delay = 1000;
      for (let i = 0; i < 10 && aliveRef.current; i++) {
        const { order } = await fetchFromAPI<{
          order: Pick<Order, "_id" | "Invoice">;
        }>(`/dashboardadmin/orders/getOne/${orderId}`);
        if (order?.Invoice) {
          setOrders((prev) =>
            prev.map((o) => (o._id === orderId ? { ...o, Invoice: true } : o))
          );
          break;
        }
        await sleep(delay);
        delay = Math.min(8000, Math.round(delay * 1.5));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Polling invoice failed:", msg);
    } finally {
      setPendingInvoiceLocal((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    }
  };

  const createInvoiceFromOrder = async (orderId: string) => {
    setPendingInvoiceLocal((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetchFromAPI<{ facture?: unknown; message?: string }>(
        `/dashboardadmin/factures/from-order/${orderId}`,
        { method: "POST" }
      );

      if (res?.facture) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, Invoice: true } : o))
        );
      } else {
        await pollInvoice(orderId);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Create facture (Pickup) failed:", msg);
      await pollInvoice(orderId);
    } finally {
      setPendingInvoiceLocal((prev) => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const current = orders.find((x) => x._id === id);
    if (!current) return;
    if (current.orderStatus === status) return;

    setSavingStatus((p) => ({ ...p, [id]: true }));
    try {
      await fetchFromAPI(`/dashboardadmin/orders/updateStatus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: status }),
      });

      setOrders((prev) =>
        prev.map((o) => (o._id === id ? { ...o, orderStatus: status } : o))
      );

      // 🚨 If we LEFT Livrée, cancel any scheduled invoice and hide the Annuler button
      if (current.orderStatus === "Delivered" && status !== "Delivered") {
        // 1) Optimistic UI removal
        setPendingMap((prev) => {
          if (!prev[id]) return prev;
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        // 2) Cancel on server (silent)
        await cancelScheduled(id, true);
      }

      // If already invoiced, don't do anything more
      if (current.Invoice) {
        setErrorMsg("Une facture a déjà été créée pour cette commande.");
        return;
      }

      if (status === "Pickup") {
        await createInvoiceFromOrder(id);
      } else if (status === "Delivered") {
        // (existing code) schedule + optimistic pending
        const etaISO = new Date(
          Date.now() + DEFAULT_INVOICE_DELAY_MS
        ).toISOString();
        setPendingMap((prev) => ({
          ...prev,
          [id]: {
            orderId: id,
            etaISO,
            msLeft: DEFAULT_INVOICE_DELAY_MS,
            source: "optimistic",
          },
        }));
        await new Promise((r) => setTimeout(r, 500));
        await refreshPendingOnce(true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Update status error ▶", msg);
      alert("Échec de la mise à jour du statut.");
    } finally {
      setSavingStatus((p) => {
        const c = { ...p };
        delete c[id];
        return c;
      });
    }
  };

  /* ------------ delete popup helpers ------------ */
  const openDelete = (id: string, ref: string) => {
    setDeleteOrderId(id);
    setDeleteOrderRef(ref);
    setIsDeleteOpen(true);
  };
  const closeDelete = () => setIsDeleteOpen(false);

  const confirmDelete = async (id: string) => {
    setDeleteLoading(true);
    try {
      await deleteOrder(id);
    } catch {
      alert("Échec de la suppression.");
    }
    setDeleteLoading(false);
    closeDelete();
  };

  /* ----------------------------- render ----------------------------- */
  return (
    <div className="mx-auto px-2 py-4 w-[95%] flex flex-col gap-4 h-full bg-green-50 rounded-xl">
      <div className="flex h-16 justify-between items-start">
        <h1 className="text-3xl font-bold uppercase">Commandes</h1>
        <Link href="/dashboard/manage-client/orders/create">
          <button className="btn-fit-white-outline">Créer une commande</button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex items-center gap-2">
          <label htmlFor="searchOrder" className="font-medium">
            Rechercher par réf :
          </label>
          <input
            id="searchOrder"
            className="FilterInput"
            placeholder="Entrer la référence"
            value={searchTerm}
            onChange={(ev) => {
              setSearchTerm(ev.target.value);
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
              onChange={(ev) => {
                setFilterStatus(ev.target.value);
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
              <th className="px-4 py-2 text-center border-r-4">Date</th>
              <th className="px-4 py-2 text-center border-r-4">Référence</th>
              <th className="px-4 py-2 text-center border-r-4">Nom client</th>
              <th className="px-4 py-2 text-center border-r-4">AL/RM</th>
              <th className="px-4 py-2 text-center border-r-4">Statut</th>
              <th className="px-4 py-2 text-center border-r-4">Facture</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
        </table>

        <div className="relative flex-1 overflow-auto">
          <table className="table-fixed w-full">
            {displayedOrders.length === 0 && !loading ? (
              <tbody>
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-600">
                    Aucune commande trouvée.
                  </td>
                </tr>
              </tbody>
            ) : (
              <tbody className="divide-y divide-gray-200 [&>tr]:h-12">
                {displayedOrders.map((o) => {
                  const hasInvoice = !!o.Invoice;
                  const isSaving = !!savingStatus[o._id];

                  const isPendingLocal = !!pendingInvoiceLocal[o._id];
                  const scheduledInfo = pendingMap[o._id];
                  const isPendingScheduled = !!scheduledInfo;
                  const isPending =
                    !hasInvoice && (isPendingLocal || isPendingScheduled);
                  const countdown = remainText(
                    scheduledInfo?.etaISO,
                    scheduledInfo?.msLeft,
                    now
                  );

                  return (
                    <tr key={o._id} className="even:bg-green-50 odd:bg-white">
                      <td className="px-4 text-center">
                        {fmtDate(o.createdAt)}
                      </td>
                      <td className="px-4 text-center truncate font-semibold">
                        {o.ref}
                      </td>
                      <td className="px-4 text-center">{o.clientName}</td>
                      <td className="px-4 text-center truncate">
                        {o.DeliveryAddress?.[0]?.DeliverToAddress?.trim() ||
                          o.pickupMagasin?.[0]?.MagasinAddress?.trim() ||
                          "—"}
                      </td>

                      <td className="px-4 text-center">
                        <NiceSelect<StatusVal>
                          value={o.orderStatus as StatusVal}
                          options={statusOptions.map((s) => s.value)}
                          onChange={(v) => updateStatus(o._id, v)}
                          display={(v) =>
                            statusOptions.find((s) => s.value === v)?.label ?? v
                          }
                          className="mx-auto"
                          disabled={isSaving}
                          loading={isSaving}
                        />
                      </td>

                      <td className="px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`inline-block h-3 w-3 rounded-full ${
                              hasInvoice
                                ? "bg-emerald-500"
                                : isPending
                                ? "bg-gray-300 animate-pulse"
                                : "bg-gray-300"
                            }`}
                            title={
                              hasInvoice
                                ? "Facture créée"
                                : isPending
                                ? "Création programmée/en cours…"
                                : "Aucune facture"
                            }
                            aria-label={
                              hasInvoice
                                ? "Facture créée"
                                : isPending
                                ? "Création programmée/en cours…"
                                : "Aucune facture"
                            }
                          />
                          {isPendingScheduled && (
                            <div className="flex items-center gap-2">
                              {/* Confirm (create now) */}
                              <button
                                onClick={() => confirmAndCreate(o._id)}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500 px-2 py-1 text-xs text-emerald-900 hover:bg-emerald-50 disabled:opacity-60 cursor-pointer"
                                disabled={
                                  !!confirming[o._id] ||
                                  !!canceling[o._id] ||
                                  isSaving
                                }
                                title="Créer la facture immédiatement"
                              >
                                {confirming[o._id] ? (
                                  <>
                                    <FaSpinner className="animate-spin" />{" "}    
                                  </>
                                ) : (
                                  <>
                                    <FiCheck />
                                  </>
                                )}
                              </button>

                              {/* Cancel scheduled */}
                              <button
                                onClick={() =>
                                  cancelScheduled(o._id, false, true)
                                }
                                className="inline-flex items-center gap-1 rounded-md border border-amber-400 px-2 py-1 text-xs text-amber-900 hover:bg-amber-100 disabled:opacity-60 cursor-pointer"
                                disabled={
                                  !!canceling[o._id] ||
                                  !!confirming[o._id] ||
                                  isSaving
                                }
                                title="Annuler la facture planifiée"
                              >
                                {canceling[o._id] ? (
                                  <>
                                    <FaSpinner className="animate-spin" />{" "}
                                  </>
                                ) : (
                                  <>
                                    <FiXCircle />
                                    {countdown && (
                                      <span className="ml-1 text-[11px] text-amber-800">
                                        ({countdown})
                                      </span>
                                    )}
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 text-center">
                        <div className="flex justify-center items-center gap-2 ">
                          <Link
                            href={`/dashboard/manage-client/orders/update/${o._id}`}
                          >
                            <button
                              className="ButtonSquare"
                              disabled={isSaving}
                            >
                              <FaRegEdit size={14} />
                            </button>
                          </Link>
                          <Link
                            href={`/dashboard/manage-client/orders/voir/${o._id}`}
                          >
                            <button
                              className="ButtonSquare"
                              disabled={isSaving}
                            >
                              <FaRegEye size={14} />
                            </button>
                          </Link>
                          <button
                            onClick={() => openDelete(o._id, o.ref)}
                            className="ButtonSquareDelete"
                            aria-label="Supprimer la commande"
                            disabled={isSaving}
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

      {/* Delete modal */}
      {isDeleteOpen && (
        <Popup
          id={deleteOrderId}
          name={deleteOrderRef}
          isLoading={deleteLoading}
          handleClosePopup={closeDelete}
          Delete={confirmDelete}
        />
      )}

      {/* Inline error dialog */}
      {errorMsg && (
        <ErrorPopup message={errorMsg} onClose={() => setErrorMsg(null)} />
      )}
    </div>
  );
}
