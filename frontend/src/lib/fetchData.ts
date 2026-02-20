// src/lib/fetchData.ts
export async function fetchData<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}/api${path}`;

  // Server components: leverage Next cache/tags
  const res = await fetch(url, {
    // keep defaults for SSG/ISR
    next: { revalidate: 600, tags: ['home-banner'] },
    ...options,
  });

  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
