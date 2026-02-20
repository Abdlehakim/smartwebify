/* ------------------------------------------------------------------
   src/app/(webpage)/orderhistory/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Pagination from "@/components/PaginationClient";
import { fetchData } from "@/lib/fetchData";
import { useCurrency } from "@/contexts/CurrencyContext";

const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

interface OrderItem {
  price: number;
  discount: number;
  quantity: number;
}
interface PaymentMethodItem {
  PaymentMethodID: string;
  PaymentMethodLabel: string;
}
interface DeliveryMethodItem {
  deliveryMethodID: string;
  deliveryMethodName?: string;
  Cost: string | number;
  expectedDeliveryDate?: string | Date;
}
interface Order {
  _id: string;
  ref: string;
  paymentMethod: PaymentMethodItem[];
  deliveryMethod: DeliveryMethodItem[];
  orderItems: OrderItem[];
  createdAt: string;
  paymentMethodLegacy?: string;
  deliveryMethodLegacy?: string;
  deliveryCostLegacy?: number;
}

export default function OrderHistory() {
  const router = useRouter();
  const { fmt } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");

  const PAR_PAGE = 5;
  const [courante, setCourante] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    let cancelled = false;

    const fetchOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");

      try {
        const data = await fetchData<Order[]>("/client/order/getOrdersByClient", {
          credentials: "include",
        });
        if (cancelled) return;
        setOrders(data);
        setPages(Math.ceil((data?.length ?? 0) / PAR_PAGE));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);

        // Safely read a numeric `status` field if present
        const status: number | undefined = (() => {
          if (typeof err === "object" && err !== null && "status" in err) {
            const s = (err as { status?: unknown }).status;
            return typeof s === "number" ? s : undefined;
          }
          return undefined;
        })();

        if (status === 401) {
          const target =
            typeof window !== "undefined"
              ? `${window.location.pathname}${window.location.search || ""}`
              : "/orderhistory";
          router.replace(`/signin?redirectTo=${encodeURIComponent(target)}`);
          return;
        }

        if (!cancelled) setOrdersError(message || "Erreur inattendue.");
      } finally {
        if (!cancelled) setOrdersLoading(false);
      }
    };

    fetchOrders();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const dateFr = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const tronque = () => {
    const start = (courante - 1) * PAR_PAGE;
    return orders.slice(start, start + PAR_PAGE);
  };

  const paymentText = (pm: PaymentMethodItem[], legacy?: string) => {
    const labels = pm.map((p) => p.PaymentMethodLabel).filter(Boolean);
    return labels.length ? labels.join(", ") : legacy || "—";
  };

  const deliveryMethodText = (dm: DeliveryMethodItem[], legacy?: string) => {
    const names = dm.map((d) => d.deliveryMethodName || "").filter(Boolean);
    return names.length ? names.join(", ") : legacy || "—";
  };

  const deliveryCostFromDM = (dm: DeliveryMethodItem[], legacy?: number) => {
    if (typeof legacy === "number") return legacy;
    return dm.reduce((sum, d) => {
      const v = typeof d.Cost === "number" ? d.Cost : parseFloat(String(d.Cost || 0));
      return sum + (isFinite(v) ? v : 0);
    }, 0);
  };

  return (
    <div className="w-[90%] mx-auto flex flex-col justify-between gap-4 h-[75vh] max-md:h-fit py-6">
      <div className="w-full max-lg:w-[95%] rounded-lg p-4 flex flex-col gap-6">
        <aside className="space-y-2">
          <h1 className="text-lg font-semibold text-black">Historique des commandes</h1>
          <p className="text-sm text-gray-400">
            Suivez l’état de vos commandes récentes, gérez les retours et téléchargez vos factures.
          </p>
        </aside>

        {ordersLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: PAR_PAGE }).map((_, i) => (
              <Skel key={i} className="w-full h-20 max-md:h-96" />
            ))}
          </div>
        ) : ordersError ? (
          <p className="text-red-500">{ordersError}</p>
        ) : orders.length === 0 ? (
          <p>Aucune commande trouvée.</p>
        ) : (
          <>
            {tronque().map((o) => {
              const itemsTotal = o.orderItems.reduce((sum, itm) => {
                const ttc = itm.discount ? (itm.price * (100 - itm.discount)) / 100 : itm.price;
                return sum + ttc * itm.quantity;
              }, 0);
              const ship = deliveryCostFromDM(o.deliveryMethod, o.deliveryCostLegacy);
              const total = itemsTotal + ship;

              return (
                <div key={o._id} className="flex flex-col gap-4">
                  <div className="bg-gray-100 rounded-lg p-6 flex justify-between items-center gap-4 max-md:flex-col max-md:items-start h-20 max-md:h-96">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Date</span>
                      <span>{dateFr(o.createdAt)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Commande n°</span>
                      <span>{o.ref}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Méthode de livraison</span>
                      <span>{deliveryMethodText(o.deliveryMethod, o.deliveryMethodLegacy)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Moyen de paiement</span>
                      <span>{paymentText(o.paymentMethod, o.paymentMethodLegacy)}</span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500">Total</span>
                      <span>{fmt(total)}</span>
                    </div>

                    <Link
                      href={`/orderhistory/${o.ref}`}
                      className="mt-2 rounded-md border border-gray-300 px-4 py-2 text-sm text-black hover:text-white hover:bg-primary max-md:text-xs max-md:w-full text-center"
                    >
                      Voir
                    </Link>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <Pagination currentPage={courante} totalPages={pages} onPageChange={setCourante} />
    </div>
  );
}
