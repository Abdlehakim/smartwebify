"use client";
import React from "react";

/* ------------------------------------------------------------------
   Simple global currency context + helper
------------------------------------------------------------------ */
const CurrencyContext = React.createContext<{
  code: string;           
  fmt(n: number): string;  
}>({
  code: "TND",
  fmt: (n) => n.toFixed(2) + " TND",        
});

/* ------------------------------------------------------------------
   Provider – inject the currency code you got from the backend
------------------------------------------------------------------ */
export const CurrencyProvider = ({
  initial,
  children,
}: {
  initial: string;          // currency code from server (ex. "EUR")
  children: React.ReactNode;
}) => {
  const value = React.useMemo(() => {
    // Always format with *two* fraction digits and the right currency
    const fmt = new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: initial,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format;
    return { code: initial, fmt };
  }, [initial]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
};

/* ------------------------------------------------------------------
   Hook – grab { code, fmt } anywhere in the component tree
------------------------------------------------------------------ */
export const useCurrency = () => React.useContext(CurrencyContext);
