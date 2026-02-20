/* ------------------------------------------------------------------
   src/app/(auth)/signin/page.tsx
------------------------------------------------------------------ */
import SignInForm from "@/components/signin/SignInForm";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.redirectTo) ? sp.redirectTo[0] : sp.redirectTo;
  const safe = typeof raw === "string" && raw.startsWith("/") ? raw : "/";
  return <SignInForm redirectTo={safe} />;
}
