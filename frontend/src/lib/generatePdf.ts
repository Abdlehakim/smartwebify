// src/lib/generatePdf.ts
const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

export type GeneratePdfInit = {
  method?: "GET" | "POST";
  payload?: unknown;
  headers?: Record<string, string>;
  credentials?: RequestCredentials; // e.g. "include" when you need cookies
  signal?: AbortSignal;

  // UI hooks
  onStart?: () => void;
  onDownloaded?: () => void; // called right after triggering the download
  onError?: (err: unknown) => void;
  onFinally?: () => void;
};

// internal: build absolute API URL
function apiUrl(endpoint: string) {
  return `${BACKEND_URL}/api${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

export async function generatePdf(
  endpoint: string,
  filename = "document.pdf",
  init: GeneratePdfInit = {}
): Promise<void> {
  const url = apiUrl(endpoint);
  const method = init.method ?? (init.payload ? "POST" : "GET");
  const headers: Record<string, string> = {
    Accept: "application/pdf",
    ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  try {
    init.onStart?.();

    const res = await fetch(url, {
      method,
      headers,
      body: method === "POST" ? JSON.stringify(init.payload ?? {}) : undefined,
      credentials: init.credentials ?? "include",
      signal: init.signal,
    });

    const ct = res.headers.get("content-type") || "";
    if (!res.ok || !/application\/pdf\b/i.test(ct)) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Unexpected response (${res.status}) content-type="${ct}". ${text.slice(0, 300)}`
      );
    }

    // Turn the response into a Blob and create a blob: URL
    const blob = await res.blob(); // reads Response into a Blob
    const href = URL.createObjectURL(blob); // blob URL for download

    // Trigger file download
    const a = document.createElement("a");
    a.href = href;
    a.download = filename; // suggest filename
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();

    init.onDownloaded?.();

    // Revoke the object URL shortly after to release memory
    setTimeout(() => URL.revokeObjectURL(href), 3000);
  } catch (err) {
    init.onError?.(err);
    throw err;
  } finally {
    init.onFinally?.();
  }
}

/** Optional: open the PDF in a new tab instead of downloading */
export async function previewPdf(
  endpoint: string,
  init: Omit<GeneratePdfInit, "onDownloaded" | "onStart" | "onFinally" | "onError"> = {}
) {
  const url = apiUrl(endpoint);
  const method = init.method ?? (init.payload ? "POST" : "GET");
  const headers: Record<string, string> = {
    Accept: "application/pdf",
    ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: method === "POST" ? JSON.stringify(init.payload ?? {}) : undefined,
    credentials: init.credentials ?? "include",
    signal: init.signal,
  });
  if (!res.ok) throw new Error(`Preview failed (${res.status})`);

  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  window.open(href, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(href), 5000);
}
