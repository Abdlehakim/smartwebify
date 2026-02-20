// src/lib/fetchFromAPI.ts

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

/**
 * Next.js's fetch supports a `next` option. Its `revalidate` can be number | false.
 * We define a loose type that won't conflict with plain RequestInit.
 */
type FetchInit = Omit<RequestInit, "next"> & {
  next?: { revalidate?: number | false };
};

export async function fetchFromAPI<T>(
  endpoint: string,
  options: FetchInit = {}
): Promise<T> {
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${BACKEND_URL}/api${path}`;

  // Avoid the "credentials default overwritten by spread" bug
  const { next, ...rest } = options;
  const init: RequestInit & { next?: { revalidate?: number | false } } = {
    ...rest,
    credentials: rest.credentials ?? "include",
    ...(next ? { next } : {}),
  };

  const res = await fetch(url, init);

  if (!res.ok) {
    // Try to surface server error text if available
    let msg = res.statusText;
    try {
      msg = await res.text();
    } catch {}
    throw new Error(`fetchFromAPI failed (${res.status}): ${msg}`);
  }

  return res.json();
}
