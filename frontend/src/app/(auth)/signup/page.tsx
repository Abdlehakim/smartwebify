// src/app/(auth)/signup/page.tsx
import SignUpForm from "@/components/signin/SignUpForm";


type SearchParams = Record<string, string | string[] | undefined>;

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.redirectTo) ? sp.redirectTo[0] : sp.redirectTo;
  const safe = typeof raw === "string" && raw.startsWith("/") ? raw : "/";

  return <SignUpForm redirectTo={safe}/>;
}
