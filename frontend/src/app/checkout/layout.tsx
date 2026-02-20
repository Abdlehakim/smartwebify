/* ------------------------------------------------------------------
   src/app/checkout/layout.tsx
------------------------------------------------------------------ */
import type { ReactNode } from "react";
import StoreProviders from "@/components/Provider/StoreProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import Providers from "@/components/Providers";
import ClientShell from "@/components/ClientShell";
import { fetchData } from "@/lib/fetchData";

export const revalidate = 10;

export default async function Layout({ children }: { children: ReactNode }) {
  let primary = "TND";
  try {
    const { primaryCurrency } = await fetchData<{ primaryCurrency: string }>(
      "/website/currency/primary",
      { next: { revalidate } }
    );
    primary = primaryCurrency;
  } catch {}

  return (
    <div className="flex flex-col">
      <CurrencyProvider initial={primary}>
        <Providers>
          <ClientShell>
            <StoreProviders>{children}</StoreProviders>
          </ClientShell>
        </Providers>
      </CurrencyProvider>
    </div>
  );
}
