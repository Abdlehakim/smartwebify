/* ------------------------------------------------------------------
   src/app/dashboard/manage-client/orders/create/page.tsx
------------------------------------------------------------------ */

"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import SelectClient, { Client } from "@/components/create-order/selectClient";
import SelectAddress, { Address } from "@/components/create-order/selectAddress";
import SelectDeliveryOption, { DeliveryOption } from "@/components/create-order/selectDeliveryOption";
import SelectMagasins, { Magasin } from "@/components/create-order/SelectMagasins";
import SelectProducts, { BasketItem, ProductLite } from "@/components/create-order/selectProducts";
import SelectPaymentMethod, { PaymentMethod } from "@/components/create-order/SelectPaymentMethod";
import OrderPreview from "@/components/create-order/OrderPreview";
import OrderStepsNav from "@/components/create-order/OrderStepsNav";
import LoadingDots from "@/components/LoadingDots";
import { fetchFromAPI } from "@/lib/fetchFromAPI";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  setStep,
  setClient,
  setAddress,
  setMagasin,
  setDeliveryOption,
  setPaymentMethod as setPMInStore,
  setBasket,
  cachePaymentMethods,
  reset as resetOrderCreation,
  selectOrderCreation,
} from "@/features/orderCreation/orderCreationSlice";

const MIN_CHARS = 2;
type DeliveryFilter = "all" | "deliveryOnly" | "pickupOnly" | null;

/** Stronger local types so we don't need `any` */
type PM = PaymentMethod & {
  _id?: string;
  payOnline?: boolean;
  requireAddress?: boolean;
};
type DO = DeliveryOption & {
  _id?: string;
  id?: string;
  price?: number;
  isPickup?: boolean;
  name?: string;
};

export default function CreateOrderPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const {
    step,
    client,
    deliveryOpt,
    paymentMethodKey,
    paymentMethodLabel,
    basket,
    selectedAddressId,
    selectedAddressLbl,
    selectedMagasinId,
    selectedMagasin,
  } = useAppSelector(selectOrderCreation);

  const [deliveryOptions, setDeliveryOptions] = useState<DO[]>([]);
  const [loadingDelivery, setLoadingDelivery] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PM[]>([]);
  const [magasinsList, setMagasinsList] = useState<Magasin[]>([]);
  const [loadingMagasins, setLoadingMagasins] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoadingDelivery(true);
    (async () => {
      try {
        const opts = await fetchFromAPI<DO[]>("/dashboardadmin/delivery-options");
        setDeliveryOptions(opts ?? []);
      } finally {
        setLoadingDelivery(false);
      }
    })();
  }, []);

  useEffect(() => {
    setLoadingMagasins(true);
    (async () => {
      try {
        const { magasins } = await fetchFromAPI<{ magasins: Magasin[] }>(
          "/dashboardadmin/stock/magasins/approved",
        );
        setMagasinsList(magasins ?? []);
      } finally {
        setLoadingMagasins(false);
      }
    })();
  }, []);

  useEffect(() => {
    setLoadingPaymentMethods(true);
    (async () => {
      try {
        const { activePaymentMethods } = await fetchFromAPI<{ activePaymentMethods: PM[] }>(
          "/dashboardadmin/payment/payment-settings/active",
        );
        dispatch(cachePaymentMethods(activePaymentMethods));
        setPaymentMethods(activePaymentMethods ?? []);
      } finally {
        setLoadingPaymentMethods(false);
      }
    })();
  }, [dispatch]);

  useEffect(() => {
    if (!client) {
      setAddresses([]);
      return;
    }
    setLoadingAddresses(true);
    (async () => {
      try {
        const { addresses } = await fetchFromAPI<{ addresses: Address[] }>(
          `/dashboardadmin/clientAddress/${client._id}`,
        );
        setAddresses(addresses ?? []);
      } finally {
        setLoadingAddresses(false);
      }
    })();
  }, [client]);

  const refreshAddresses = useCallback(async () => {
    if (!client?._id) return;
    setLoadingAddresses(true);
    try {
      const { addresses } = await fetchFromAPI<{ addresses: Address[] }>(
        `/dashboardadmin/clientAddress/${client._id}`,
      );
      setAddresses(addresses ?? []);
    } finally {
      setLoadingAddresses(false);
    }
  }, [client?._id]);

  const searchClients = useCallback(async (q: string): Promise<Client[]> => {
    if (q.trim().length < MIN_CHARS) return [];
    const { clients } = await fetchFromAPI<{ clients: Client[] }>(
      `/dashboardadmin/client/find?q=${encodeURIComponent(q.trim())}`,
    );
    return clients ?? [];
  }, []);

  const searchProducts = useCallback(
    async (q: string): Promise<ProductLite[]> => {
      if (q.trim().length < MIN_CHARS) return [];
      const { products } = await fetchFromAPI<{ products: ProductLite[] }>(
        `/dashboardadmin/stock/products/find?q=${encodeURIComponent(q.trim())}`,
      );
      return products ?? [];
    },
    [],
  );

  const updateBasket = useCallback(
    (action: React.SetStateAction<BasketItem[]>) => {
      const newBasket = typeof action === "function" ? (action as (b: BasketItem[]) => BasketItem[])(basket) : action;
      dispatch(setBasket(newBasket));
    },
    [basket, dispatch],
  );

  const handleDeliveryChange = useCallback(
    (_: string | null, opt: DeliveryOption | null) => {
      dispatch(setDeliveryOption(opt));
      const o = opt as DO | null;
      if (!o || o.isPickup) {
        dispatch(setAddress({ id: null, label: null }));
      } else {
        dispatch(setMagasin({ id: null, magasin: null }));
      }
    },
    [dispatch],
  );

  const cancelAndReturn = useCallback(() => {
    dispatch(resetOrderCreation());
    router.push("/dashboard/manage-client/orders");
  }, [dispatch, router]);

  const selectedPaymentMeta = useMemo(
    () => paymentMethods.find((m) => m._id === paymentMethodKey) || null,
    [paymentMethods, paymentMethodKey],
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

  const canGoStep2 = Boolean(client && basket.length > 0);
  const canGoStep3 = useMemo(() => {
    if (!paymentMethodKey) return false;
    if (!deliveryOpt) return false;
    const d = deliveryOpt as DO;
    return d.isPickup ? selectedMagasinId !== null : selectedAddressId !== null;
  }, [paymentMethodKey, deliveryOpt, selectedMagasinId, selectedAddressId]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);

      const d = (deliveryOpt ?? null) as DO | null;
      const isPickup = d?.isPickup ?? false;

      const pickupArray =
        isPickup && selectedMagasin
          ? [
              {
                MagasinID: selectedMagasin._id,
                MagasinName: selectedMagasin.name,
                MagasinAddress: [selectedMagasin.address, selectedMagasin.city].filter(Boolean).join(", "),
              },
            ]
          : [];

      const deliveryArray =
        !isPickup && selectedAddressId && selectedAddressLbl
          ? [
              {
                AddressID: selectedAddressId,
                DeliverToAddress: selectedAddressLbl,
              },
            ]
          : [];

      const selectedPM = paymentMethods.find((pm) => pm._id === paymentMethodKey) || null;
      const paymentArray =
        selectedPM && selectedPM._id
          ? [
              {
                PaymentMethodID: selectedPM._id,
                PaymentMethodLabel: selectedPM.label,
              },
            ]
          : [];

      const deliveryMethodArray = d
        ? [
            {
              deliveryMethodID: d._id ?? d.id ?? "",
              deliveryMethodName: d.name ?? "",
              Cost: Number.isFinite(d.price ?? NaN) ? (d.price as number).toFixed(2) : "0.00",
            },
          ]
        : [];

      const payload = {
        client: client!._id,
        clientName: client!.username ?? client!.name,
        DeliveryAddress: deliveryArray,
        pickupMagasin: pickupArray,
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
        paymentMethod: paymentArray,
        deliveryMethod: deliveryMethodArray,
      };

      const { order } = await fetchFromAPI<{ order: { _id: string } }>("/dashboardadmin/orders/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      dispatch(resetOrderCreation());
      router.push(`/dashboard/manage-client/orders/voir/${order._id}`);
    } catch (err) {
      console.error("Order submission failed:", err);
      alert("Échec de la soumission de la commande.");
      setIsSubmitting(false);
    }
  }, [
    client,
    deliveryOpt,
    selectedMagasin,
    selectedAddressId,
    selectedAddressLbl,
    paymentMethods,
    paymentMethodKey,
    basket,
    dispatch,
    router,
  ]);

  const clearSelectedClient = useCallback(() => {
    dispatch(setClient(null));
    dispatch(setAddress({ id: null, label: null }));
    dispatch(setBasket([]));
    dispatch(setPMInStore({ key: null, label: null }));
    dispatch(setDeliveryOption(null));
    dispatch(setMagasin({ id: null, magasin: null }));
  }, [dispatch]);

  const handlePaymentChange = useCallback(
    (id: string | null, method: PaymentMethod | null) => {
      dispatch(setPMInStore({ key: id, label: method?.label ?? null }));
      dispatch(setDeliveryOption(null));
      dispatch(setAddress({ id: null, label: null }));
      dispatch(setMagasin({ id: null, magasin: null }));
    },
    [dispatch],
  );

  /* ---------- Full-page loader while submitting (outside buttons) ---------- */
  if (isSubmitting) {
    return (
      <div
        className="relative h-full w-full flex items-center justify-center"
        aria-live="polite"
        role="status"
      >
        <LoadingDots loadingMessage="Envoi de la commande…" />
      </div>
    );
  }

  return (
    <>
      <div className="w-[95%] mx-auto py-4 flex flex-col gap-4 h-full">
        <h1 className="text-2xl font-bold uppercase">Créer une commande</h1>
        <OrderStepsNav currentStep={step} />

        {step === 1 && (
          <div className="flex-1 flex flex-col justify-between">
            <div className="flex flex-col gap-4">
              <SelectClient
                client={client}
                searchClients={searchClients}
                onSelect={(c) => dispatch(setClient(c))}
                onClear={clearSelectedClient}
              />

              <SelectProducts
                client={client}
                basket={basket}
                setBasket={updateBasket}
                searchProducts={searchProducts}
              />
            </div>

            <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
              <button onClick={cancelAndReturn} className="btn-fit-white-outline">
                Annuler
              </button>
              <button
                onClick={() => dispatch(setStep(2))}
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
                onChange={handlePaymentChange}
              />

              {deliveryFilter && (
                <SelectDeliveryOption
                  value={(deliveryOpt as DO | null)?._id ?? (deliveryOpt as DO | null)?.id ?? null}
                  onChange={handleDeliveryChange}
                  options={filteredDeliveryOptions}
                  loading={loadingDelivery}
                />
              )}

              {deliveryOpt && !(deliveryOpt as DO).isPickup && (
                <SelectAddress
                  client={client}
                  addresses={addresses}
                  value={selectedAddressId}
                  onChange={(id, label) => dispatch(setAddress({ id, label }))}
                  loading={loadingAddresses}
                  refreshAddresses={refreshAddresses}
                />
              )}

              {deliveryOpt && (deliveryOpt as DO).isPickup && (
                <SelectMagasins
                  value={selectedMagasinId}
                  magasins={magasinsList}
                  loading={loadingMagasins}
                  onChange={(id, b) => dispatch(setMagasin({ id, magasin: b }))}
                />
              )}
            </div>

            <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
              <button onClick={cancelAndReturn} className="btn-fit-white-outline">
                Annuler
              </button>
              <div className="flex gap-4">
                <button onClick={() => dispatch(setStep(1))} className="btn-fit-white-outline">
                  ← Précédent
                </button>

                <button
                  onClick={() => dispatch(setStep(3))}
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
                onClose={() => dispatch(setStep(2))}
                client={client}
                addressLabel={selectedAddressLbl}
                magasin={selectedMagasin}
                delivery={deliveryOpt as DO}
                basket={basket}
                paymentMethod={paymentMethodLabel}
              />
            </div>

            <div className="mx-auto w-full max-w-[80%] flex justify-between gap-4 py-4">
              <button onClick={cancelAndReturn} className="btn-fit-white-outline">
                Annuler
              </button>
              <div className="flex gap-4">
                <button onClick={() => dispatch(setStep(2))} className="btn-fit-white-outline">
                  ← Précédent
                </button>

                <button onClick={handleSubmit} className="btn-fit-white-outline">
                  Confirmer la commande
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
