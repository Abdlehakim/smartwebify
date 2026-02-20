// ───────────────────────────────────────────────────────────────
// src/routes/products/SearchProduct.ts
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";

const router = Router();

/**
 * (Optional) Add this once to Product schema for better ranking:
 * ProductSchema.index(
 *   { name: "text", info: "text", description: "text" },
 *   { weights: { name: 10, info: 5, description: 2 }, name: "ProductTextIdx" }
 * );
 */

/* ---------------- helpers ---------------- */
type SortTuples =
  | [string, 1 | -1 | "asc" | "desc" | "ascending" | "descending"][]
  | string;

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function parsePositiveInt(val: any, def: number) {
  const n = Number.parseInt(String(val ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : def;
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isTextIndexMissingError(err: unknown): boolean {
  const msg = (err as any)?.message as string | undefined;
  return typeof msg === "string" && /text index|text index required|must have a text index/i.test(msg);
}

/** Build filter from query; uses $text when enabled, else regex across key fields. */
function buildSearchFilter(q: string, useText: boolean) {
  if (!q) return { vadmin: "approve" } as Record<string, any>;

  if (useText) {
    return { vadmin: "approve", $text: { $search: q } };
  }

  const rx = new RegExp(escapeRegExp(q), "i");
  return {
    vadmin: "approve",
    $or: [
      { name: rx },
      { info: rx },
      { description: rx },
      { reference: rx },
      { slug: rx },
    ],
  };
}

/** Sort options without textScore case. */
function buildNonTextSort(sort: string): SortTuples {
  const map: Record<string, SortTuples> = {
    newest: [["createdAt", -1]],
    price_asc: [["price", 1], ["createdAt", -1]],
    price_desc: [["price", -1], ["createdAt", -1]],
    rating_desc: [["averageRating", -1], ["nbreview", -1], ["createdAt", -1]],
  };
  return map[sort] ?? map["newest"];
}

/** Apply sort on a query; uses $meta textScore only when requested. */
function applySort<T extends any>(
  query: T,
  sortKey: string,
  useTextSearch: boolean
) {
  if (useTextSearch && (!sortKey || sortKey === "relevance")) {
    // Mongoose accepts this at runtime; cast to any to satisfy TS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (query as any).sort({ score: { $meta: "textScore" } } as any);
  }
  return (query as any).sort(buildNonTextSort(sortKey));
}

/* ================================================================== */
/*  GET /api/products/search                                          */
/*  Query:                                                            */
/*    q: string                                                       */
/*    page: number (default 1)                                        */
/*    limit: number (default 12, max 50)                              */
/*    sort: relevance | newest | price_asc | price_desc | rating_desc */
/*    includeOutOfStock: "1" to include out-of-stock products         */
/* ================================================================== */
router.get("/search", async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.q ?? "").trim();
  const page = parsePositiveInt(req.query.page, 1);
  const rawLimit = parsePositiveInt(req.query.limit, 12);
  const limit = clamp(rawLimit, 1, 50);
  const skip = (page - 1) * limit;
  const sortParam = String(req.query.sort ?? "relevance");
  const includeOut = String(req.query.includeOutOfStock ?? "") === "1";

  const preferTextSearch = q.length >= 2;

  async function run(useTextSearch: boolean) {
    const match = buildSearchFilter(q, useTextSearch);

    if (!includeOut) {
      (match as any).stockStatus = "in stock";
    }

    const projection: Record<string, any> = {
      name: 1,
      slug: 1,
      reference: 1,
      price: 1,
      discount: 1,
      stock: 1,
      stockStatus: 1,
      averageRating: 1,
      nbreview: 1,
      mainImageUrl: 1,
      createdAt: 1,
    };
    if (useTextSearch) {
      projection.score = { $meta: "textScore" } as any;
    }

    const countPromise = Product.countDocuments(match);
    let findQuery = Product.find(match, projection).skip(skip).limit(limit).collation({ locale: "fr", strength: 1 }).lean();

    findQuery = applySort(findQuery, sortParam, useTextSearch);

    const [total, items] = await Promise.all([countPromise, findQuery]);
    return { total, items, usedText: useTextSearch };
  }

  try {
    let result: Awaited<ReturnType<typeof run>>;
    try {
      result = await run(preferTextSearch);
    } catch (err) {
      if (preferTextSearch && isTextIndexMissingError(err)) {
        result = await run(false);
      } else {
        throw err;
      }
    }

    const totalPages = Math.max(1, Math.ceil(result.total / limit));

    res.json({
      q,
      page,
      limit,
      total: result.total,
      totalPages,
      sort: result.usedText ? (sortParam || "relevance") : (sortParam || "newest"),
      items: result.items,
      usedTextSearch: result.usedText,
    });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ================================================================== */
/*  GET /api/products/search/suggest                                  */
/*  Lightweight suggestions for autocomplete                          */
/*  Query: q (required-ish), limit (default 8, max 15)                */
/* ================================================================== */
router.get("/search/suggest", async (req: Request, res: Response): Promise<void> => {
  const q = String(req.query.q ?? "").trim();
  const rawLimit = parsePositiveInt(req.query.limit, 8);
  const limit = clamp(rawLimit, 1, 15);

  if (q.length < 1) {
    res.json([]);
    return;
  }

  const preferTextSearch = q.length >= 2;

  async function run(useTextSearch: boolean) {
    const match = buildSearchFilter(q, useTextSearch);

    const projection: Record<string, any> = {
      name: 1,
      slug: 1,
      mainImageUrl: 1,
      price: 1,
      discount: 1,
    };
    if (useTextSearch) {
      projection.score = { $meta: "textScore" } as any;
    }

    let findQuery = Product.find(match, projection).limit(limit).collation({ locale: "fr", strength: 1 }).lean();

    findQuery = applySort(findQuery, "relevance", useTextSearch);

    const suggestions = await findQuery;
    return suggestions;
  }

  try {
    let items: any[];
    try {
      items = await run(preferTextSearch);
    } catch (err) {
      if (preferTextSearch && isTextIndexMissingError(err)) {
        items = await run(false);
      } else {
        throw err;
      }
    }

    res.json(items);
  } catch (err) {
    console.error("Suggest error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
