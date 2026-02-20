/* ------------------------------------------------------------------
   src/features/orderCreation/orderCreationSlice.ts
------------------------------------------------------------------ */
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import type { Client } from "@/components/create-order/selectClient";
import type { Address } from "@/components/create-order/selectAddress";
import type { DeliveryOption } from "@/components/create-order/selectDeliveryOption";
import type { Magasin } from "@/components/create-order/SelectMagasins";
import type { BasketItem } from "@/components/create-order/selectProducts";
import type { PaymentMethod } from "@/components/create-order/SelectPaymentMethod";

/* ---------- state ---------- */
interface OrderCreationState {
  /* --- commande courante --- */
  step: 1 | 2 | 3;
  client: Client | null;

  selectedAddressId: string | null;
  selectedAddressLbl: string | null;

  selectedMagasinId: string | null;
  selectedMagasin: Magasin | null;

  deliveryOpt: DeliveryOption | null;

  paymentMethodKey: string | null;
  paymentMethodLabel: string | null;

  basket: BasketItem[];

  /* --- caches partagés (persistés) --- */
  deliveryOptions: DeliveryOption[];
  magasins: Magasin[];
  paymentMethods: PaymentMethod[];
  addressesCache: Record<string, Address[]>; // par clientId
}

const initialState: OrderCreationState = {
  step: 1,
  client: null,

  selectedAddressId: null,
  selectedAddressLbl: null,

  selectedMagasinId: null,
  selectedMagasin: null,

  deliveryOpt: null,

  paymentMethodKey: null,
  paymentMethodLabel: null,

  basket: [],

  deliveryOptions: [],
  magasins: [],
  paymentMethods: [],
  addressesCache: {},
};

/* ---------- slice ---------- */
const orderCreationSlice = createSlice({
  name: "orderCreation",
  initialState,
  reducers: {
    /* ----- setters commande ----- */
    setStep:  (s, a: PayloadAction<1 | 2 | 3>) => { s.step = a.payload; },
    setClient:(s, a: PayloadAction<Client | null>) => { s.client = a.payload; },
    setAddress(
      s,
      a: PayloadAction<{ id: string | null; label: string | null }>
    ) {
      s.selectedAddressId  = a.payload.id;
      s.selectedAddressLbl = a.payload.label;
    },
    setMagasin(
      s,
      a: PayloadAction<{ id: string | null; magasin: Magasin | null }>
    ) {
      s.selectedMagasinId = a.payload.id;
      s.selectedMagasin   = a.payload.magasin;
    },
    setDeliveryOption: (s, a: PayloadAction<DeliveryOption | null>) => {
      s.deliveryOpt = a.payload;
    },
    setPaymentMethod(
      s,
      a: PayloadAction<{ key: string | null; label: string | null }>
    ) {
      s.paymentMethodKey   = a.payload.key;
      s.paymentMethodLabel = a.payload.label;
    },
    setBasket: (s, a: PayloadAction<BasketItem[]>) => { s.basket = a.payload; },

    /* ----- caches partagés ----- */
    cacheDeliveryOptions: (s, a: PayloadAction<DeliveryOption[]>) => {
      s.deliveryOptions = a.payload;
    },
    cacheMagasins: (s, a: PayloadAction<Magasin[]>) => {
      s.magasins = a.payload;
    },
    cachePaymentMethods: (s, a: PayloadAction<PaymentMethod[]>) => {
      s.paymentMethods = a.payload;
    },
    cacheAddresses: (
      s,
      a: PayloadAction<{ clientId: string; addresses: Address[] }>
    ) => {
      s.addressesCache[a.payload.clientId] = a.payload.addresses;
    },

    /* ----- reset après submit ----- */
    reset(state) {
      const {
        deliveryOptions,
        magasins,
        paymentMethods,
        addressesCache,
      } = state;

      Object.assign(state, initialState);

      /* préservation des caches */
      state.deliveryOptions = deliveryOptions;
      state.magasins       = magasins;
      state.paymentMethods  = paymentMethods;
      state.addressesCache  = addressesCache;
    },
  },
});

/* ---------- exports ---------- */
export const {
  setStep,
  setClient,
  setAddress,
  setMagasin,
  setDeliveryOption,
  setPaymentMethod,
  setBasket,
  cacheDeliveryOptions,
  cacheMagasins,
  cachePaymentMethods,
  cacheAddresses,
  reset,
} = orderCreationSlice.actions;

export default orderCreationSlice.reducer;

/* ---------- selector ---------- */
export const selectOrderCreation = (root: { orderCreation: OrderCreationState }) =>
  root.orderCreation;
