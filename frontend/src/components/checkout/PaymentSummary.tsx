/* ------------------------------------------------------------------
   src/components/checkout/PaymentSummary.tsx
------------------------------------------------------------------ */
"use client";

import React, { useEffect, useState, FormEvent, ReactNode, useMemo } from "react";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { clearCart, CartItem } from "@/store/cartSlice";
import PaypalButton from "@/components/checkout/PaypalButton";
import { fetchData } from "@/lib/fetchData";
import LoadingDots from "@/components/LoadingDots";
import Notification, { NotificationType } from "@/components/ui/Notification";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { Magasin } from "@/components/checkout/MagasinSelected";

interface PaymentSummaryProps {
  items: CartItem[];
  totalPrice: number;
  totalDiscount: number;
  deliveryCost: number;
  selectedMethod: string;
  selectedMethodId?: string;
  selectedExpectedDeliveryDate?: string;
  selectedPaymentMethod: string;
  address: { AddressId: string; DeliverToAddress: string };
  currentStep: "cart" | "checkout" | "order-summary";
  onCheckout(): void;
  backcarte(): void;
  handleOrderSummary(ref: string): void;
  isPickup?: boolean;
  selectedMagasinId?: string | null;
  selectedMagasin?: Magasin | null;
}

type OrderLineAttribute = { attribute: string; name: string; value: string };
type OrderLine = {
  _id: string;
  reference: string;
  name: string;
  quantity: number;
  tva: number;
  mainImageUrl?: string;
  discount: number;
  price: number;
  attributes: OrderLineAttribute[];
};

interface OrderPayload {
  paymentMethod: string;
  items: OrderLine[];
  deliveryMethod: {
    deliveryMethodID?: string;
    deliveryMethodName?: string;
    Cost: string;
    expectedDeliveryDate?: string;
  }[];
  pickupMagasin?: {
    MagasinID: string | null;
    MagasinName: string;
    MagasinAddress: string;
  }[];
  DeliveryAddress?: {
    AddressID: string;
    DeliverToAddress: string;
  }[];
}

function formattedMissing(list: string[]): ReactNode {
  return list.map((txt, idx) => (
    <React.Fragment key={idx}>
      {idx === 0 ? "" : idx === list.length - 1 ? " et " : ", "}
      <span className="font-semibold text-red-600">{txt}</span>
    </React.Fragment>
  ));
}

const PaymentSummary: React.FC<PaymentSummaryProps> = ({
  items,
  totalPrice,
  totalDiscount,
  deliveryCost,
  selectedMethod,
  selectedMethodId,
  selectedExpectedDeliveryDate,
  selectedPaymentMethod,
  address,
  currentStep,
  onCheckout,
  backcarte,
  handleOrderSummary,
  isPickup = false,
  selectedMagasinId = null,
  selectedMagasin = null,
}) => {
  const dispatch = useDispatch();
  const { fmt } = useCurrency();

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [totalWithShipping, setTotalWithShipping] = useState(totalPrice + deliveryCost);
  const [totalTva, setTotalTva] = useState(0);

  // NEW: lightweight status flag to control LoadingDots message
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    setTotalWithShipping(totalPrice + deliveryCost);
    const tvaSum = items.reduce((sum, it) => {
      const ttc = it.discount ? (it.price * (100 - it.discount)) / 100 : it.price;
      const unitTva = ttc - ttc / (1 + it.tva / 100);
      return sum + unitTva * it.quantity;
    }, 0);
    setTotalTva(tvaSum);
  }, [items, totalPrice, deliveryCost]);

  const isFormValid = useMemo(() => {
    if (!selectedMethodId || !selectedPaymentMethod) return false;
    if (isPickup) {
      const addr = selectedMagasin?.address?.trim();
      return Boolean(selectedMagasinId && addr);
    }
    return Boolean(address.AddressId);
  }, [
    isPickup,
    selectedMagasinId,
    selectedMagasin,
    address.AddressId,
    selectedMethodId,
    selectedPaymentMethod,
  ]);

  const [notification, setNotification] = useState<{
    message: ReactNode;
    type: NotificationType;
  } | null>(null);
  const hideNotification = () => setNotification(null);

  const sendMail = async (ref: string) => {
    try {
      await fetch("/api/sendEmail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref }),
      });
    } catch {
      /* noop */
    }
  };

  const postOrder = async () => {
    const attrsFromCartItem = (
      selected?: Record<string, string>,
      selectedNames?: Record<string, string>
    ): OrderLineAttribute[] => {
      if (!selected) return [];
      const out: OrderLineAttribute[] = [];
      for (const [attrId, value] of Object.entries(selected)) {
        let name = "Attribute";
        if (selectedNames) {
          const lbl = Object.keys(selectedNames).find((k) => selectedNames[k] === value);
          if (lbl) name = lbl;
        }
        out.push({ attribute: attrId, name, value });
      }
      return out;
    };

    const lines: OrderLine[] = items.map(
      ({ _id, reference, name, quantity, tva, mainImageUrl, discount, price, selected, selectedNames }) => ({
        _id,
        reference,
        name,
        quantity,
        tva,
        mainImageUrl,
        discount: discount ?? 0,
        price,
        attributes: attrsFromCartItem(selected, selectedNames),
      })
    );

    const payload: OrderPayload = {
      paymentMethod: selectedPaymentMethod,
      items: lines,
      deliveryMethod: [
        {
          deliveryMethodID: selectedMethodId,
          deliveryMethodName: selectedMethod,
          Cost: Number.isFinite(deliveryCost) ? deliveryCost.toFixed(2) : "0.00",
          ...(selectedExpectedDeliveryDate ? { expectedDeliveryDate: selectedExpectedDeliveryDate } : {}),
        },
      ],
    };

    if (isPickup) {
      const magasinName = selectedMagasin?.MagasinName ?? selectedMagasin?.name ?? "";
      const magasinAddress = selectedMagasin?.address ?? "";
      payload.pickupMagasin = [
        {
          MagasinID: selectedMagasinId,
          MagasinName: magasinName,
          MagasinAddress: magasinAddress,
        },
      ];
    } else {
      payload.DeliveryAddress = [
        {
          AddressID: address.AddressId,
          DeliverToAddress: address.DeliverToAddress,
        },
      ];
    }

    const { ref } = await fetchData<{ ref: string }>("/client/order/postOrderClient", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    await sendMail(ref);
    toast.success("Commande envoyée avec succès !");
    dispatch(clearCart());
    handleOrderSummary(ref);
  };

  const handleOrderSubmit = async (e?: FormEvent) => {
    e?.preventDefault();

    if (!isFormValid) {
      const missing: string[] = [];
      if (!selectedPaymentMethod) missing.push("le moyen de paiement");
      if (!selectedMethodId) missing.push("la méthode de livraison");
      if (isPickup) {
        if (!selectedMagasinId) missing.push("le magasin de retrait");
        if (!selectedMagasin?.address?.trim()) missing.push("l’adresse du magasin");
      } else {
        if (!address.AddressId) missing.push("l’adresse de livraison");
      }

      setNotification({
        message: <>Veuillez sélectionner {formattedMissing(missing)}.</>,
        type: "error",
      });
      return;
    }

    setSubmitStatus("loading"); // NEW
    setIsSubmittingOrder(true);
    try {
      await postOrder();
      setSubmitStatus("success"); // NEW: show success text briefly
      // let the success message be visible for a moment
      setTimeout(() => setSubmitStatus("idle"), 1200);
    } catch {
      setSubmitStatus("idle"); // NEW: make sure success text isn't shown on error
      setNotification({
        message: "Échec de l’envoi de la commande. Veuillez réessayer.",
        type: "error",
      });
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handlePayPalSuccess = () => handleOrderSubmit();
  const isPayPal = selectedPaymentMethod.toLowerCase() === "paypal";

  return (
    <>
      {notification && (
        <Notification message={notification.message} type={notification.type} onClose={hideNotification} />
      )}

      {(isSubmittingOrder || submitStatus === "success") && (
        <div className="fixed inset-0 z-[1000] bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <LoadingDots
            loadingMessage="Commande en cours d’envoi…"
            successMessage="Commande envoyée avec succès."
            isSuccess={submitStatus === "success"}
          />
        </div>
      )}

      <div className="bg-gray-100 rounded-md p-4 w-[420px] max-lg:w-full">
        <div className="mt-8 sticky top-4 space-y-8">
          <div className="flex border border-[#15335E] overflow-hidden rounded-md">
            <input type="text" placeholder="Code promo" className="w-full bg-white px-4 py-2.5 text-sm" />
            <button className="bg-primary px-4 text-sm font-semibold text-white">Appliquer</button>
          </div>

          <ul className="space-y-4 text-gray-800">
            <li className="flex justify-between text-base">
              <span>Remise</span>
              <span className="font-bold">{fmt(totalDiscount)}</span>
            </li>
            <li className="flex justify-between text-base">
              <span>Livraison</span>
              <span className="font-bold">{fmt(deliveryCost)}</span>
            </li>
            <li className="flex justify-between text-base">
              <span>TVA</span>
              <span className="font-bold">{fmt(totalTva)}</span>
            </li>
            <li className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{fmt(totalWithShipping)}</span>
            </li>
          </ul>

          {currentStep === "checkout" && (
            <div className="space-y-2">
              {!isPayPal && (
                <button
                  onClick={handleOrderSubmit}
                  disabled={!isFormValid}
                  className={`mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm ${
                    isFormValid ? "text-black hover:bg-primary hover:text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Confirmer la commande
                </button>
              )}

              {isPayPal && (
                <div className={isFormValid ? "" : "opacity-50 pointer-events-none"}>
                  <PaypalButton amount={totalWithShipping.toFixed(2)} onSuccess={handlePayPalSuccess} />
                </div>
              )}

              <button
                onClick={backcarte}
                className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white"
              >
                Retourner
              </button>

              <Link href="/">
                <button className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white">
                  Annuler
                </button>
              </Link>
            </div>
          )}

          {currentStep === "cart" && (
            <div className="space-y-2">
              <button
                onClick={onCheckout}
                className={`mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm ${
                  items.length ? "text-black hover:bg-primary hover:text-white" : "bg-gray-200 text-gray-400 cursor-not-allowed pointer-events-none"
                }`}
              >
                Continuer
              </button>
              <Link href="/">
                <button className="mt-2 w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm hover:bg-primary hover:text-white">
                  Annuler
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentSummary;
