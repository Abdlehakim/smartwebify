/* ------------------------------------------------------------------
   src/app/(webpage)/layout.tsx
------------------------------------------------------------------ */
import { Suspense } from "react";
import Footer from "@/components/menu/Footer";
import Header from "@/components/menu/Header";
import StoreProviders from "@/components/Provider/StoreProvider";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { AuthProvider } from "@/hooks/useAuth"; // ← add this
import ClientShell from "@/components/ClientShell";
import { fetchData } from "@/lib/fetchData";
import { FooterLockProvider } from "@/contexts/FooterLockContext";
import FooterVisibilityController from "@/components/menu/FooterVisibilityController";

export const revalidate = 10;

async function getPrimaryCurrency() {
  try {
    const { primaryCurrency } = await fetchData<{ primaryCurrency: string }>(
      "/website/currency/primary",
      { next: { revalidate: 60, tags: ["currency"] } }
    );
    return primaryCurrency ?? "TND";
  } catch {
    return "TND";
  }
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const primary = await getPrimaryCurrency();

  return (
    <div className="flex flex-col min-h-screen">
      <CurrencyProvider initial={primary}>
        <FooterLockProvider>
          {/* AuthProvider must wrap ClientShell because ClientShell uses useAuth */}
          <AuthProvider>
            <ClientShell requireAuth={false}>
              <StoreProviders>
                <Header />
                {children}

                <Suspense fallback={<div className="h-24" />}>
                  <div id="footer-container">
                    <Footer />
                  </div>
                </Suspense>

                <FooterVisibilityController />
              </StoreProviders>
            </ClientShell>
          </AuthProvider>
        </FooterLockProvider>
      </CurrencyProvider>
    </div>
  );
}