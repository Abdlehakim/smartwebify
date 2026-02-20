// src/contexts/FooterLockContext.tsx
"use client";

import { createContext, useContext, useMemo, useState } from "react";

type Ctx = { locked: boolean; setLocked: (v: boolean) => void };
const FooterLockContext = createContext<Ctx | null>(null);

export function FooterLockProvider({ children }: { children: React.ReactNode }) {
  const [locked, setLocked] = useState(false);
  const value = useMemo(() => ({ locked, setLocked }), [locked]);
  return <FooterLockContext.Provider value={value}>{children}</FooterLockContext.Provider>;
}

export function useFooterLock() {
  const ctx = useContext(FooterLockContext);
  if (!ctx) throw new Error("useFooterLock must be used within FooterLockProvider");
  return ctx;
}
