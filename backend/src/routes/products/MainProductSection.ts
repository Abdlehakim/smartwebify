import { Router, Request, Response } from "express";
import mongoose from "mongoose";

import Product          from "@/models/stock/Product";
import ProductAttribute from "@/models/stock/ProductAttribute";
import websiteTitres from "@/models/websitedata/websiteTitres";


const router = Router();


router.get(
  '/SimilarProductTitles',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const titles = await websiteTitres.findOne()
        .select("SimilarProductTitre SimilarProductSubTitre")
        .exec();

      res.json(titles);
    } catch (err) {
      console.error("productPageTitlesData Error:", err);
      res
        .status(500)
        .json({ error: "Error fetching productPageTitlesData" });
    }
  }  
);

/* ================================================================== */
/*  GET /api/products/MainProductSection/allProductSlugs              */
/* ================================================================== */
router.get("/allProductSlugs", async (_req, res) => {
  try {
    const slugs = await Product.find({ vadmin: "approve" })
      .select("slug -_id")
      .lean<{ slug: string }[]>();

    res.json(slugs.map((d) => d.slug));
  } catch (err) {
    console.error("Error fetching slugs:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/* ================================================================== */
/*  GET /api/products/MainProductSection/:slugProduct                 */
/*  Heavy PDP data — returns *all* fields                             */
/* ================================================================== */
router.get("/:slugProduct", async (req: Request, res: Response) => {
  try {
    const product = await Product.findOne({
      slug: req.params.slugProduct,
      vadmin: "approve",
    })
      .populate("categorie", "name slug")
      .populate("subcategorie", "name slug")
      .populate("brand", "name")
      .populate("magasin", "name")
      .populate({
        path: "attributes.attributeSelected",
        model: ProductAttribute,
        select: "name type image",
      })
      .lean();

    res.json(product);
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
});

/* ================================================================== */
/*  GET /api/products/MainProductSection/prodcutDetails/:slugProduct  */
/*  Lightweight details — returns description + productDetails only   */
/* ================================================================== */
router.get(
  "/productDetails/:slugProduct",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const product = await Product.findOne({
        slug: req.params.slugProduct,
        vadmin: "approve",
      })
        .select({
          description: 1,
          "productDetails.name": 1,
          "productDetails.description": 1,
          "productDetails.image": 1,
          _id: 0,
        })
        .lean();

      if (!product) {
        res.status(404).json({ message: "Product not found" });
        return;
      }

      /*  Optional clean-up: keep rows that have a non-blank name  */
      const filtered = {
        ...product,
        productDetails: (product.productDetails || []).filter(
          (row: any) => row?.name && row.name.trim()
        ),
      };

      res.json(filtered);
    } catch (err) {
      console.error("Error fetching product details:", err);
      res.status(500).json({ error: "Error fetching data" });
    }
  }
);
/* ================================================================== */
/*  GET /api/products/MainProductSection/similarById/:id              */
/*  Returns a NEW random sample on every request                      */
/*  ?limit=<n>&exclude=<slug>                                         */
/* ================================================================== */
router.get("/similarById/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const limitRaw = parseInt(req.query.limit as string, 10);
    const limit    = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 4;
    const exclude  = String(req.query.exclude || "");

    let objId: mongoose.Types.ObjectId;
    try {
      objId = new mongoose.Types.ObjectId(id);
    } catch {
      res.json([]);
      return;
    }

    const pipeline = [
      {
        $match: {
          vadmin: "approve",
          ...(exclude && { slug: { $ne: exclude } }),
          $or: [{ categorie: objId }, { subcategorie: objId }],
        },
      },
      { $sample: { size: limit } },
      {
        $project: {
          _id: 1,
          name: 1,
          slug: 1,
          price: 1,
          discount: 1,
          stock: 1,
          mainImageUrl: 1,
        },
      },
    ];

    const raw = await Product.aggregate(pipeline);
    const stamp = Date.now();

    // keep _id, add client-only key
    const data = raw.map((p: any, i: number) => ({
      ...p,
      __key: `${p._id}-${stamp}-${i}`, // for React keys if needed
    }));

    res.json(data);
  } catch (err) {
    console.error("Error fetching random similar products:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


/* ================================================================== */
/*  GET /api/products/MainProductSection/attributes/:productId        */
/*  Returns ONLY the product's attributes (lightweight)               */
/* ================================================================== */
router.get(
  "/attributes/:productId",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      // If you ever want to support slug too, keep this fallback:
      const byId = mongoose.isValidObjectId(productId);
      const match = byId ? { _id: productId } : { slug: productId };

      const doc = await Product.findOne({
        ...match,
        vadmin: "approve",
      })
        .select({ attributes: 1, _id: 0 })
        .populate({
          path: "attributes.attributeSelected",
          // model declared in schema, passing name is optional — kept explicit:
          model: ProductAttribute,
          select: "name type", // keep payload small
        })
        .lean();

      if (!doc) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      // Normalize the payload into a compact, frontend-friendly shape
      // Attribute type on your model can be string | string[]; collapse to one string.
      const collapseType = (t: unknown): string => {
        if (Array.isArray(t) && t.length > 0) return String(t[0]);
        if (typeof t === "string") return t;
        return "other type";
      };

      const cleanValue = (v: unknown) => {
        if (v === undefined || v === null) return null;
        if (typeof v === "string") return v;
        if (Array.isArray(v)) {
          return v.map((o: any) => {
            const out: Record<string, string> = { name: String(o?.name ?? "") };
            if (o?.value) out.value = String(o.value);
            if (o?.hex) out.hex = String(o.hex);
            if (o?.image) out.image = String(o.image);
            return out;
          });
        }
        return null;
      };

      const attrs = (doc.attributes ?? []).map((row: any) => {
        const sel = row?.attributeSelected;
        return {
          attributeSelected: {
            _id: String(sel?._id ?? ""),
            name: String(sel?.name ?? "Attribute"),
            type: collapseType(sel?.type),
          },
          value: cleanValue(row?.value),
        };
      });

      res.json(attrs);
    } catch (err) {
      console.error("attributes/:productId error:", err);
      res.status(500).json({ error: "Error fetching attributes" });
    }
  }
);




export default router;
