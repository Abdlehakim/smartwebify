/* ------------------------------------------------------------------
   src/app/checkout/page.tsx
------------------------------------------------------------------ */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { CartItem, removeItem, updateItemQuantity } from "@/store/cartSlice";

import CheckoutNav from "@/components/checkout/CheckoutNav";
import RecapProduct from "@/components/checkout/RecapProduct";
import PaymentSummary from "@/components/checkout/PaymentSummary";
import PaymentMethode from "@/components/checkout/PaymentMethode";
import DeliveryAddressSelect from "@/components/checkout/DeliveryAddress";
import DeliveryMethod from "@/components/checkout/DeliveryMethod";
import OrderSummary from "@/components/checkout/OrderSummary";
import Magasins, { Magasin } from "@/components/checkout/MagasinSelected";

import { fetchData } from "@/lib/fetchData";

interface PaymentMethodAPI {
  _id?: string;
  name?: string;
  label: string;
  help?: string;
  payOnline?: boolean;
  requireAddress?: boolean;
}

interface DeliveryOptionAPI {
  id: string;
  name: string;
  description?: string;
  cost: number;
  estimatedDays?: number;
  isPickup?: boolean;
}

const Checkout: React.FC = () => {
  const items = useSelector((s: RootState) => s.cart.items);
  const dispatch = useDispatch();


  const [currentStep, setCurrentStep] =
    useState<"cart" | "checkout" | "order-summary">("cart");
  const [refOrder, setRefOrder] = useState("");

  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [selectedDeliverToAddress, setSelectedDeliverToAddress] = useState<string>("");

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");

  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [selectedMethodName, setSelectedMethodName] = useState<string>("");
  const [selectedExpectedDeliveryDate, setSelectedExpectedDeliveryDate] = useState<string | undefined>(undefined);

  const [deliveryCost, setDeliveryCost] = useState(0);

  const [selectedMagasinId, setSelectedMagasinId] = useState<string | null>(null);
  const [selectedMagasin, setSelectedMagasin] = useState<Magasin | null>(null);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodAPI[]>([]);
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptionAPI[]>([]);

  const addressSectionRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    (async () => {
      try {
        const pm = await fetchData<PaymentMethodAPI[]>("/checkout/payment-methods");
        setPaymentMethods(pm || []);
      } catch {
        setPaymentMethods([]);
      }
      try {
        const opts = await fetchData<DeliveryOptionAPI[]>("/checkout/delivery-options");
        setDeliveryOptions((opts || []).sort((a, b) => a.cost - b.cost));
      } catch {
        setDeliveryOptions([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (currentStep === "checkout" && addressSectionRef.current) {
      addressSectionRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [currentStep]);

  const totalPrice = items.reduce((sum, item) => {
    const ttc = item.discount ? (item.price * (100 - item.discount)) / 100 : item.price;
    return sum + ttc * item.quantity;
  }, 0);

  const totalDiscount = items.reduce((sum, item) => {
    const full = item.price * item.quantity;
    const disc = item.discount
      ? ((item.price * (100 - item.discount)) / 100) * item.quantity
      : full;
    return sum + (full - disc);
  }, 0);

  const incrementHandler = (it: CartItem) =>
    dispatch(updateItemQuantity({ _id: it._id, quantity: it.quantity + 1 }));
  const decrementHandler = (it: CartItem) =>
    it.quantity > 1 &&
    dispatch(updateItemQuantity({ _id: it._id, quantity: it.quantity - 1 }));
  const removeCartHandler = (id: string) => dispatch(removeItem({ _id: id }));

  const handleAddressChange = (id: string, deliverToAddress: string) => {
    setSelectedAddressId(id);
    setSelectedDeliverToAddress(deliverToAddress);
  };

  const handleMethodChange = (id: string, name: string, price: number, expected?: string) => {
    setSelectedMethodId(id);
    setSelectedMethodName(name);
    setDeliveryCost(price);
    setSelectedExpectedDeliveryDate(expected);
  };

  const handlePaymentChange = (_id: string, label: string) => {
    setSelectedPaymentMethod(label);
    setSelectedMethodId("");
    setSelectedMethodName("");
    setSelectedExpectedDeliveryDate(undefined);
    setDeliveryCost(0);
    setSelectedAddressId("");
    setSelectedDeliverToAddress("");
    setSelectedMagasinId(null);
    setSelectedMagasin(null);
  };

  const handleOrderSummary = (ref: string) => {
    setRefOrder(ref);
    setCurrentStep("order-summary");
  };

  const selectedPaymentMeta =
    paymentMethods.find((m) => m.label === selectedPaymentMethod) || null;

  const deliveryFilter: "all" | "deliveryOnly" | "pickupOnly" | null = selectedPaymentMeta
    ? selectedPaymentMeta.payOnline && selectedPaymentMeta.requireAddress
      ? "all"
      : selectedPaymentMeta.requireAddress
      ? "deliveryOnly"
      : "pickupOnly"
    : null;

  const selectedDeliveryMeta =
    deliveryOptions.find((o) => o.id === selectedMethodId) || null;

  const selectedIsPickup = !!selectedDeliveryMeta?.isPickup;

  return (
    <div className="my-8 flex flex-col gap-4">
      <CheckoutNav currentStep={currentStep} />

      {currentStep === "cart" && (
        <div className="mx-auto w-[80%] max-md:w-[90%] flex max-lg:flex-col gap-4">
          <RecapProduct
            items={items}
            incrementHandler={incrementHandler}
            decrementHandler={decrementHandler}
            removeCartHandler={removeCartHandler}
          />
          <PaymentSummary
            currentStep="cart"
            items={items}
            totalPrice={totalPrice}
            totalDiscount={totalDiscount}
            deliveryCost={deliveryCost}
            selectedMethod={selectedMethodName}
            selectedMethodId={selectedMethodId}
            selectedExpectedDeliveryDate={selectedExpectedDeliveryDate}
            selectedPaymentMethod={selectedPaymentMethod}
            address={{ AddressId: selectedAddressId, DeliverToAddress: selectedDeliverToAddress }}
            onCheckout={() => setCurrentStep("checkout")}
            backcarte={() => setCurrentStep("cart")}
            handleOrderSummary={handleOrderSummary}
            isPickup={selectedIsPickup}
            selectedMagasinId={selectedMagasinId}
            selectedMagasin={selectedMagasin}
          />
        </div>
      )}

      {currentStep === "checkout" && (
        <div className="mx-auto w-[80%] max-md:w-[90%] flex max-lg:flex-col gap-4">
          <div
            ref={addressSectionRef}
            className="w-[70%] p-4 flex flex-col gap-8 bg-gray-100 rounded-md max-lg:w-full max-lg:gap-4"
          >
            <PaymentMethode
              selectedPaymentMethod={selectedPaymentMethod}
              handlePaymentMethodChange={handlePaymentChange}
            />

            {selectedPaymentMeta && deliveryFilter && (
              <DeliveryMethod
                filter={deliveryFilter}
                selectedMethodId={selectedMethodId}
                onMethodChange={handleMethodChange}
              />
            )}

            {selectedPaymentMeta && selectedMethodId && (
              selectedIsPickup ? (
                <Magasins
                  value={selectedMagasinId}
                  onChange={(id, m) => {
                    setSelectedMagasinId(id);
                    setSelectedMagasin(m);
                  }}
                />
              ) : (
                <DeliveryAddressSelect
                  selectedAddressId={selectedAddressId}
                  onAddressChange={handleAddressChange}
                />
              )
            )}
          </div>

          <PaymentSummary
            currentStep="checkout"
            items={items}
            totalPrice={totalPrice}
            totalDiscount={totalDiscount}
            deliveryCost={deliveryCost}
            selectedMethod={selectedMethodName}
            selectedMethodId={selectedMethodId}
            selectedExpectedDeliveryDate={selectedExpectedDeliveryDate}
            selectedPaymentMethod={selectedPaymentMethod}
            address={{ AddressId: selectedAddressId, DeliverToAddress: selectedDeliverToAddress }}
            onCheckout={() => setCurrentStep("checkout")}
            backcarte={() => setCurrentStep("cart")}
            handleOrderSummary={handleOrderSummary}
            isPickup={selectedIsPickup}
            selectedMagasinId={selectedMagasinId}
            selectedMagasin={selectedMagasin}
          />
        </div>
      )}

      {currentStep === "order-summary" && <OrderSummary data={refOrder} />}
    </div>
  );
};

export default Checkout;
