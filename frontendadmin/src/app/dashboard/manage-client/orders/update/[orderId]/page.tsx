/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/update/[orderId]/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

import OrderStepsNav from "@/components/create-order/OrderStepsNav";
import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectProducts, { ProductLite, BasketItem } from "@/components/create-order/selectProducts";
import SelectDeliveryOption, { DeliveryOption } from "@/components/create-order/selectDeliveryOption";
import SelectAddress, { Address } from "@/components/create-order/selectAddress";
import SelectMagasins, { Magasin } from "@/components/create-order/SelectMagasins";
import SelectPaymentMethod, { PaymentMethod } from "@/components/create-order/SelectPaymentMethod";
import OrderPreview from "@/components/create-order/OrderPreview";
import LoadingDots from "@/components/LoadingDots";

const MIN_CHARS = 2;
type DeliveryFilter = "all" | "deliveryOnly" | "pickupOnly" | null;

type PM = PaymentMethod & { _id?: string; payOnline?: boolean; requireAddress?: boolean };
type DO = DeliveryOption & { _id?: string; id?: string; price?: number; isPickup?: boolean; description?: string };
type DeliveryOptionAPI = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  price?: number;
  cost?: number;
  isPickup?: boolean;
};

interface RawAttribute {
  attribute: string;
  name: string;
  value: string;
}

interface OrderResponse {
  order: {
    _id: string;
    client: Client;
    clientName: string;
    paymentMethod: Array<{ PaymentMethodID: string; PaymentMethodLabel: string }>;
    deliveryMethod: Array<{ deliveryMethodID: string; deliveryMethodName?: string; Cost: string; expectedDeliveryDate?: string }>;
    pickupMagasin: Array<{ MagasinID: string; MagasinName?: string; MagasinAddress: string }>;
    DeliveryAddress: Array<{ AddressID: string; DeliverToAddress: string }>;
    orderItems: Array<{
      product: string;
      reference: string;
      name: string;
      price: number;
      tva: number;
      discount: number;
      quantity: number;
      attributes?: RawAttribute[];
    }>;
  };
}

export default function UpdateOrderPage() {
  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const prevClientIdRef = useRef<string | null>(null); // track real client changes

  const [basket, setBasket] = useState<BasketItem[]>([]);

  const [deliveryOpt, setDeliveryOpt] = useState<DO | null>(null);
  const [deliveryOptions, setDeliveryOptions] = useState<DO[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PM[]>([]);
  const [paymentMethodKey, setPaymentMethodKey] = useState<string | null>(null);
  const [paymentMethodLabel, setPaymentMethodLabel] = useState<string | null>(null);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedAddressLbl, setSelectedAddressLbl] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [loadingMagasins, setLoadingMagasins] = useState(false);
  const [magasins, setMagasins] = useState<Magasin[]>([]);
  const [selectedMagasinId, setSelectedMagasinId] = useState<string | null>(null);
  const [selectedMagasin, setSelectedMagasin] = useState<Magasin | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(true);

  const searchClients = useCallback(async (q: string): Promise<Client[]> => {
    if (q.trim().length < MIN_CHARS) return [];
    const { clients } = await fetchFromAPI<{ clients: Client[] }>(
      `/dashboardadmin/client/find?q=${encodeURIComponent(q.trim())}`
    );
    return clients ?? [];
  }, []);

  const searchProducts = useCallback(async (q: string): Promise<ProductLite[]> => {
    if (q.trim().length < MIN_CHARS) return [];
    const { products } = await fetchFromAPI<{ products: ProductLite[] }>(
      `/dashboardadmin/stock/products/find?q=${encodeURIComponent(q.trim())}`
    );
    return products ?? [];
  }, []);

  const updateBasket = useCallback(
    (action: React.SetStateAction<BasketItem[]>) => {
      setBasket((prev) => (typeof action === "function" ? (action as (b: BasketItem[]) => BasketItem[])(prev) : action));
    },
    []
  );

  useEffect(() => {
    setLoadingMagasins(true);
    fetchFromAPI<{ magasins: Magasin[] }>("/dashboardadmin/stock/magasins/approved")
      .then(({ magasins }) => setMagasins(magasins ?? []))
      .catch((e) => console.error("Load magasins error:", e))
      .finally(() => setLoadingMagasins(false));
  }, []);

  useEffect(() => {
    if (!selectedMagasinId || !magasins.length) return;
    const full = magasins.find((b) => b._id === selectedMagasinId);
    if (full) setSelectedMagasin(full);
  }, [magasins, selectedMagasinId]);

  useEffect(() => {
    setLoadingPaymentMethods(true);
    fetchFromAPI<{ activePaymentMethods: PM[] }>("/dashboardadmin/payment/payment-settings/active")
      .then(({ activePaymentMethods }) => setPaymentMethods(activePaymentMethods ?? []))
      .catch((e) => console.error("Load payment methods error:", e))
      .finally(() => setLoadingPaymentMethods(false));
  }, []);

  // Delivery options
  useEffect(() => {
    setLoadingDelivery(true);
    fetchFromAPI<DeliveryOptionAPI[]>("/dashboardadmin/delivery-options")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const mapped: DO[] = list.map((o) => ({
          _id: String(o._id ?? o.id ?? ""),
          id: String(o.id ?? o._id ?? ""),
          name: o.name,
          description: o.description ?? "",
          price: Number(o.price ?? o.cost ?? 0),
          isPickup: Boolean(o.isPickup),
        }));
        setDeliveryOptions(mapped);
      })
      .catch((e) => console.error("Load delivery options error:", e))
      .finally(() => setLoadingDelivery(false));
  }, []);

  // Load order
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingOrder(true);
      try {
        const { order } = await fetchFromAPI<OrderResponse>(`/dashboardadmin/orders/${orderId}`);

        if (cancelled) return;

        setSelectedClient(order.client);
        prevClientIdRef.current = order.client?._id ?? null; // mark initial id

        const productsDefs = await Promise.all(
          order.orderItems.map((it) =>
            fetchFromAPI<{ products: ProductLite[] }>(
              `/dashboardadmin/stock/products/find?q=${encodeURIComponent(it.reference)}`
            ).then((res) => res.products?.[0])
          )
        );
        if (cancelled) return;

        setBasket(
          order.orderItems.map((it, idx) => {
            const prodDef = productsDefs[idx];
            const chosen: Record<string, string> = {};
            (it.attributes || []).forEach((attr) => {
              chosen[attr.attribute] = attr.value;
            });
            const attrs: BasketItem["attributes"] = (prodDef?.attributes ?? []) as BasketItem["attributes"];
            return {
              _id: it.product,
              name: it.name,
              reference: it.reference,
              price: it.price,
              tva: it.tva,
              discount: it.discount,
              quantity: it.quantity,
              stockStatus: "in stock",
              attributes: attrs,
              chosen,
            };
          })
        );

        if (order.DeliveryAddress?.length) {
          setSelectedAddressId(String(order.DeliveryAddress[0].AddressID));
          setSelectedAddressLbl(order.DeliveryAddress[0].DeliverToAddress);
        } else {
          setSelectedAddressId(null);
          setSelectedAddressLbl(null);
        }

        if (order.pickupMagasin?.length) {
          const first = order.pickupMagasin[0];
          const id = String(first.MagasinID);
          setSelectedMagasinId(id);
          setSelectedMagasin((prev) => prev ?? { _id: id, name: first.MagasinName ?? "", address: first.MagasinAddress });
        } else {
          setSelectedMagasinId(null);
          setSelectedMagasin(null);
        }

        const pmRow = order.paymentMethod?.[0];
        if (pmRow) {
          setPaymentMethodKey(pmRow.PaymentMethodID);
          setPaymentMethodLabel(pmRow.PaymentMethodLabel);
        } else {
          setPaymentMethodKey(null);
          setPaymentMethodLabel(null);
        }

        const dmRow = order.deliveryMethod?.[0];
        if (dmRow) {
          // will be matched once deliveryOptions are there (next effect handles it too)
          const pick = (opts: DO[]) =>
            opts.find((d) => d._id === dmRow.deliveryMethodID || d.id === dmRow.deliveryMethodID) ||
            opts.find((d) => d.name === dmRow.deliveryMethodName) ||
            null;
          setDeliveryOpt((prev) => prev || pick(deliveryOptions) || null);
        } else {
          setDeliveryOpt(null);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Impossible de charger la commande.");
      } finally {
        if (!cancelled) setLoadingOrder(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  // Late bind delivery method after options arrive
  useEffect(() => {
    if (deliveryOpt || !deliveryOptions.length) return;
    (async () => {
      try {
        const { order } = await fetchFromAPI<OrderResponse>(`/dashboardadmin/orders/${orderId}`);
        const dmRow = order.deliveryMethod?.[0];
        if (!dmRow) return;
        const found =
          deliveryOptions.find((d) => d._id === dmRow.deliveryMethodID || d.id === dmRow.deliveryMethodID) ||
          deliveryOptions.find((d) => d.name === dmRow.deliveryMethodName);
        if (found) setDeliveryOpt(found);
      } catch {
        /* ignore */
      }
    })();
  }, [deliveryOptions, deliveryOpt, orderId]);

  // Load addresses for selected client
  useEffect(() => {
    if (!selectedClient) {
      setAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    fetchFromAPI<{ addresses: Address[] }>(`/dashboardadmin/clientAddress/${selectedClient._id}`)
      .then(({ addresses }) => setAddresses(addresses ?? []))
      .finally(() => setLoadingAddresses(false));
  }, [selectedClient]);

  // If the client REALLY changed (not initial mount), reset address/magasin selection
  useEffect(() => {
    const cur = selectedClient?._id ?? null;
    if (cur === null) return;

    if (prevClientIdRef.current === null) {
      prevClientIdRef.current = cur;
      return; // initial mount
    }

    if (prevClientIdRef.current !== cur) {
      // user changed client ➜ clear dependent selections
      setSelectedAddressId(null);
      setSelectedAddressLbl(null);
      setSelectedMagasinId(null);
      setSelectedMagasin(null);
    }

    prevClientIdRef.current = cur;
  }, [selectedClient?._id]);

  const cancel = () => router.back();

  const selectedPaymentMeta = useMemo(
    () => paymentMethods.find((m) => m._id === paymentMethodKey) || null,
    [paymentMethods, paymentMethodKey]
  );

  const deliveryFilter: DeliveryFilter = useMemo(() => {
    if (!selectedPaymentMeta) return null;
    const payOnline = selectedPaymentMeta.payOnline ?? false;
    const requireAddress = selectedPaymentMeta.requireAddress ?? false;
    if (payOnline && requireAddress) return "all";
    if (requireAddress) return "deliveryOnly";
    return "pickupOnly";
  }, [selectedPaymentMeta]);

  const filteredDeliveryOptions = useMemo(() => {
    if (!deliveryFilter) return [];
    if (deliveryFilter === "all") return deliveryOptions;
    if (deliveryFilter === "deliveryOnly") return deliveryOptions.filter((o) => !o.isPickup);
    return deliveryOptions.filter((o) => o.isPickup);
  }, [deliveryFilter, deliveryOptions]);

  // Strong validation: selected id must exist in current list
  const hasValidAddressSelection = useMemo(() => {
    if (!deliveryOpt || deliveryOpt.isPickup) return true;
    if (!selectedAddressId) return false;
    return addresses.some((a) => a._id === selectedAddressId);
  }, [deliveryOpt, selectedAddressId, addresses]);

  const hasValidMagasinSelection = useMemo(() => {
    if (!deliveryOpt || !deliveryOpt.isPickup) return true;
    if (!selectedMagasinId) return false;
    return magasins.some((m) => m._id === selectedMagasinId);
  }, [deliveryOpt, selectedMagasinId, magasins]);

  const paymentOK = Boolean(paymentMethodKey);
  const canGoStep2 = basket.length > 0;
  const canGoStep3 =
    canGoStep2 &&
    paymentOK &&
    !!deliveryOpt &&
    hasValidAddressSelection &&
    hasValidMagasinSelection;

  const isBootstrapping =
    loadingOrder || loadingPaymentMethods || loadingDelivery || loadingMagasins;

  const save = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const isPickup = deliveryOpt?.isPickup ?? false;

      const pickupArray =
        isPickup && selectedMagasin
          ? [
              {
                MagasinID: selectedMagasin._id,
                MagasinName: selectedMagasin.name ?? "",
                MagasinAddress: [selectedMagasin.address, selectedMagasin.city].filter(Boolean).join(", "),
              },
            ]
          : [];

      const deliveryArray =
        !isPickup && selectedAddressId && selectedAddressLbl
          ? [{ AddressID: selectedAddressId, DeliverToAddress: selectedAddressLbl }]
          : [];

      const paymentArray =
        paymentMethodKey && paymentMethodLabel
          ? [{ PaymentMethodID: paymentMethodKey, PaymentMethodLabel: paymentMethodLabel }]
          : [];

      const deliveryMethodArray = deliveryOpt
        ? [
            {
              deliveryMethodID: deliveryOpt._id ?? deliveryOpt.id ?? "",
              deliveryMethodName: deliveryOpt.name ?? "",
              Cost: Number.isFinite(deliveryOpt.price ?? NaN) ? (deliveryOpt.price as number).toFixed(2) : "0.00",
            },
          ]
        : [];

      await fetchFromAPI(`/dashboardadmin/orders/update/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: selectedClient?._id ?? null,
          clientName: selectedClient?.username ?? selectedClient?.name ?? "",
          DeliveryAddress: deliveryArray,
          pickupMagasin: pickupArray,
          paymentMethod: paymentArray,
          deliveryMethod: deliveryMethodArray,
          orderItems: basket.map((it) => ({
            product: it._id,
            reference: it.reference,
            name: it.name,
            tva: it.tva,
            quantity: it.quantity,
            discount: it.discount,
            price: it.price,
            attributes: it.attributes?.map((row) => ({
              attribute: row.attributeSelected._id,
              name: row.attributeSelected.name,
              value: it.chosen[row.attributeSelected._id]!,
            })),
          })),
        }),
      });
      router.push(`/dashboard/manage-client/orders/voir/${orderId}`);
    } catch (e) {
      console.error(e);
      setError("Échec de la mise à jour.");
      setIsSaving(false);
    }
  };

  if (error) return <p className="text-red-600">{error}</p>;

  // show loader before displaying the UI
  if (isBootstrapping) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Chargement des données de la commande…" />
      </div>
    );
  }

  // show a full-page loader WHILE SAVING (outside buttons), same wrapper style
  if (isSaving) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Enregistrement de la commande…" />
      </div>
    );
  }

  return (
    <>
      <div className="w-[95%] mx-auto py-4 flex flex-col gap-4 h-full">
        <h1 className="text-2xl font-bold uppercase">Modifier la commande</h1>
        <OrderStepsNav currentStep={step} />

        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <SelectClient
                client={selectedClient}
                searchClients={searchClients}
                onSelect={setSelectedClient}
                onClear={() => setSelectedClient(null)}
              />

              <SelectProducts
                client={selectedClient}
                basket={basket}
                setBasket={updateBasket}
                searchProducts={searchProducts}
              />
            </div>

            <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
              <button onClick={cancel} className="btn-fit-white-outline">
                Annuler
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!canGoStep2}
                className="btn-fit-white-outline disabled:opacity-50"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="flex-1 flex flex-col gap-6">
              <SelectPaymentMethod
                value={paymentMethodKey}
                methods={paymentMethods}
                loading={loadingPaymentMethods}
                onChange={(id, method) => {
                  setPaymentMethodKey(id);
                  setPaymentMethodLabel(method?.label ?? null);
                  setDeliveryOpt(null);
                  setSelectedAddressId(null);
                  setSelectedAddressLbl(null);
                  setSelectedMagasinId(null);
                  setSelectedMagasin(null);
                }}
              />

              {deliveryFilter && (
                <SelectDeliveryOption
                  value={deliveryOpt?._id ?? deliveryOpt?.id ?? null}
                  onChange={(_, opt) => {
                    const o = (opt ?? null) as DO | null;
                    setDeliveryOpt(o);
                    if (o?.isPickup) {
                      setSelectedAddressId(null);
                      setSelectedAddressLbl(null);
                    } else {
                      setSelectedMagasinId(null);
                      setSelectedMagasin(null);
                    }
                  }}
                  options={filteredDeliveryOptions}
                  loading={loadingDelivery}
                />
              )}

              {deliveryOpt && !deliveryOpt.isPickup && (
                <SelectAddress
                  client={selectedClient}
                  addresses={addresses}
                  value={selectedAddressId}
                  onChange={(id, label) => {
                    setSelectedAddressId(id);
                    setSelectedAddressLbl(label);
                  }}
                  loading={loadingAddresses}
                />
              )}

              {deliveryOpt?.isPickup && (
                <SelectMagasins
                  value={selectedMagasinId}
                  magasins={magasins}
                  loading={loadingMagasins}
                  onChange={(id, b) => {
                    setSelectedMagasinId(id);
                    setSelectedMagasin(b ?? null);
                  }}
                />
              )}
            </div>

            <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
              <button onClick={cancel} className="btn-fit-white-outline">
                Annuler
              </button>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="btn-fit-white-outline">
                  ← Précédent
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!canGoStep3}
                  className="btn-fit-white-outline disabled:opacity-50"
                >
                  Suivant →
                </button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col">
              <OrderPreview
                onClose={() => setStep(2)}
                client={selectedClient}
                addressLabel={selectedAddressLbl}
                magasin={selectedMagasin}
                delivery={deliveryOpt as DeliveryOption | null}
                basket={basket}
                paymentMethod={paymentMethodLabel}
              />
            </div>

            <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
              <button onClick={cancel} className="btn-fit-white-outline">
                Annuler
              </button>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="btn-fit-white-outline">
                  ← Précédent
                </button>
                <button
                  onClick={save}
                  disabled={!canGoStep3}
                  className="btn-fit-white-outline disabled:opacity-50"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
