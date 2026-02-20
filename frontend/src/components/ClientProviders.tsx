"use client";

import { SessionProvider } from "next-auth/react";
import StoreProviders from "@/components/Provider/StoreProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <StoreProviders>{children}</StoreProviders>
    </SessionProvider>
  );
}
