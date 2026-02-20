// src/app/page.tsx
import SignInClient from "@/components/SignInClient";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function DashboardSignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;

  const raw = Array.isArray(sp.redirectTo) ? sp.redirectTo[0] : sp.redirectTo;
  const decoded = typeof raw === "string" ? decodeURIComponent(raw) : undefined;
  const redirectTo = decoded && decoded.startsWith("/") ? decoded : "/dashboard";

  return <SignInClient redirectTo={redirectTo} />;
}
