// src/components/topbar/TopBar.tsx
"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiBell, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { fetchFromAPI } from "@/lib/fetchFromAPI";
import { useRouter } from "next/navigation";

type OrderMini = {
  _id: string;
  ref?: string;
  clientName: string;
  createdAt: string; // ISO
  orderStatus?: string;
};

const POLL_MS = 15000; // 15s
const PAGE_SIZE = 5;
const LAST_COUNT = 30;
const LS_KEY = "orders_last_seen_ts";

export default function TopBar() {
  const router = useRouter();
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [orders, setOrders] = useState<OrderMini[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pos, setPos] = useState<{ top: number; right: number; width: number } | null>(null);
  const [unseen, setUnseen] = useState(0);

  // --- helpers
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });

  const updatePos = () => {
    const b = btnRef.current?.getBoundingClientRect();
    if (!b) return;
    const vw = window.innerWidth;
    setPos({ top: b.bottom + 8, right: vw - b.right, width: 420 });
  };

  // --- fetch & poll
  const load = async () => {
    try {
      const { orders } = await fetchFromAPI<{ orders: OrderMini[] }>("/dashboardadmin/orders");
      const sorted = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      setOrders(sorted);
      const lastSeen = Number(localStorage.getItem(LS_KEY) || 0);
      const count = sorted.filter((o) => +new Date(o.createdAt) > lastSeen).length;
      setUnseen(count);
    } catch (e) {
      console.error("Notifications load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  // open/close positioning + outside click
  useLayoutEffect(() => {
    if (!open) return;
    updatePos();
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      const isInside = (t as HTMLElement).closest("[data-orders-panel]");
      if (!isInside) setOpen(false);
    };
    const onMove = () => updatePos();
    document.addEventListener("mousedown", onClick);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onMove, true);
    };
  }, [open]);

  // mark as seen when opening
  useEffect(() => {
    if (!open || orders.length === 0) return;
    const newestTs = +new Date(orders[0].createdAt);
    localStorage.setItem(LS_KEY, String(newestTs));
    setUnseen(0);
  }, [open, orders]);

  // last 30 orders with client-side pagination of 5
  const last30 = useMemo(() => orders.slice(0, LAST_COUNT), [orders]);
  const totalPages = Math.max(1, Math.ceil(last30.length / PAGE_SIZE));
  const curPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => last30.slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE),
    [last30, curPage]
  );

  // navigate to order detail
  const goToOrder = (id: string) => {
    setOpen(false);
    router.push(`/dashboard/manage-client/orders/voir/${id}`);
  };

  return (
    <div className="flex items-center h-fit py-4 mx-auto w-[95%] bg-white text-primary">
      <div className="flex justify-end w-full">
        <button
          ref={btnRef}
          onClick={() => setOpen((s) => !s)}
          aria-label="Notifications"
          className="relative p-2 rounded-lg hover:bg-primary/5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        >
          <FiBell size={30} />
          {unseen > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-[11px] leading-[18px] text-white text-center rounded-full bg-quaternary">
              {unseen > 9 ? "9+" : unseen}
            </span>
          )}
        </button>
      </div>

      {/* Dropdown panel (portal) */}
      {open && pos && typeof window !== "undefined" &&
        createPortal(
          <div
            data-orders-panel
            className="fixed z-[1100]"
            style={{ top: pos.top, right: pos.right, width: pos.width }}
          >
            <div className="rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col h-[500px] max-h-[calc(100vh-130px)]">
              <div className="px-4 py-3 border-b border-gray-300 bg-gray-50 flex items-center justify-between shrink-0">
                <span className="font-semibold text-sm">Dernières commandes</span>
                <span className="text-xs text-gray-500">
                  {loading ? "Chargement…" : `${last30.length} récentes`}
                </span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-sm text-gray-500">Chargement…</div>
                ) : pageItems.length === 0 ? (
                  <div className="p-6 text-sm text-gray-500">Aucune commande.</div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {pageItems.map((o) => (
                      <li
                        key={o._id}
                        onClick={() => goToOrder(o._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") goToOrder(o._id);
                        }}
                        role="link"
                        tabIndex={0}
                        className="
                          px-4 py-3 text-sm cursor-pointer
                          hover:bg-primary
                          hover:[&_*]:!text-white
                          hover:[&_*]:!fill-white
                          hover:[&_*]:!stroke-white
                          [&_*]:transition-colors
                        "
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium truncate">
                              {o.clientName || "Client inconnu"}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {o.ref ?? o._id}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 shrink-0">
                            {fmtDate(o.createdAt)}
                          </div>
                        </div>
                        {o.orderStatus && (
                          <div className="mt-1 text-xs text-emerald-700">
                            {o.orderStatus}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Pagination (5 per page) */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-300 shrink-0">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={curPage === 1}
                  className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md hover:text-primary disabled:opacity-40 cursor-pointer"
                >
                  <FiChevronLeft /> Précedent
                </button>
                <div className="text-xs text-gray-600">
                  Page {curPage} / {totalPages}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={curPage === totalPages}
                  className="inline-flex items-center gap-1 text-sm px-2 py-1 rounded-md hover:text-primary disabled:opacity-40 cursor-pointer"
                >
                  Suivant <FiChevronRight />
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
