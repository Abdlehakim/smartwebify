// src/constants/paymentMethodsData.ts
export const PAYMENT_METHOD_KEYS = ["paypal","stripe","cashOnDelivery","payInMagasin"] as const;
export type PaymentMethodKey = (typeof PAYMENT_METHOD_KEYS)[number];

export interface PaymentMethodMeta {
  payOnline: boolean;
  requireAddress: boolean;
  defaultLabel: string;
  defaultHelp: string;
}

export const PAYMENT_METHOD_META: Record<PaymentMethodKey, PaymentMethodMeta> = {
  paypal:         { payOnline: true,  requireAddress: true,  defaultLabel: "PayPal",                    defaultHelp: "" },
  stripe:         { payOnline: true,  requireAddress: true,  defaultLabel: "Paiement en ligne (Stripe)", defaultHelp: "" },
  cashOnDelivery: { payOnline: false, requireAddress: true,  defaultLabel: "Paiement à la livraison",    defaultHelp: "" },
  payInMagasin:   { payOnline: false, requireAddress: false, defaultLabel: "Payer en magasin",           defaultHelp: "" },
};

export const EMPTY_METHOD_CFG = {
  enabled: false,
  label: "",
  help: "",
  payOnline: false,
  requireAddress: false,
} as const;

export const PAYMENT_METHODS_SEED = PAYMENT_METHOD_KEYS.map((name) => ({
  name,
  enabled: false,
  label: PAYMENT_METHOD_META[name].defaultLabel,
  help: PAYMENT_METHOD_META[name].defaultHelp,
  payOnline: PAYMENT_METHOD_META[name].payOnline,
  requireAddress: PAYMENT_METHOD_META[name].requireAddress,
}));
