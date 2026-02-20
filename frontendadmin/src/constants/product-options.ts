// ───────────────────────────────────────────────────────────────
// src/constants/product-options.ts
// ───────────────────────────────────────────────────────────────
export const STOCK_OPTIONS = ["in stock", "out of stock"] as const;
export const PAGE_OPTIONS = [
  "none",
  "new-products",
  "promotion",
  "best-collection",
] as const;
export const ADMIN_OPTIONS = ["not-approve", "approve"] as const;

export type StockStatus = (typeof STOCK_OPTIONS)[number];
export type StatusPage = (typeof PAGE_OPTIONS)[number];
export type Vadmin = (typeof ADMIN_OPTIONS)[number];
