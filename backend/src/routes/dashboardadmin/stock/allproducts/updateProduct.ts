// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/stock/allproducts/updateProduct.ts
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
function extractPublicId(url: string): string {
  const [, rest] = url.split("/upload/");
  return rest?.replace(/\.(jpg|jpeg|png|webp|gif|svg)$/i, "") ?? url;
}

/* safe JSON parse with fallback */
function parseJson<T>(raw: unknown, fallback: T): T {
  try {
    if (typeof raw !== "string") return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/* ------------------------------------------------------------------ */
/*  PUT /api/dashboardadmin/stock/products/update/:productId          */
/* ------------------------------------------------------------------ */
router.put(
  "/update/:productId",
  requirePermission("M_Stock"),
  memoryUpload.fields([
    { name: "mainImage",       maxCount: 1  },
    { name: "extraImages",     maxCount: 10 },
    { name: "attributeImages", maxCount: 30 },
    { name: "detailsImages",   maxCount: 50 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { productId } = req.params;
    const userId = req.dashboardUser?._id;

    if (!userId) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      /* ---------- fetch existing ---------- */
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        res.status(404).json({ message: "Product not found." });
        return;
      }

      /* ------------------------------------------------------------------ */
      /* 1) scalar fields                                                   */
      /* ------------------------------------------------------------------ */
      const updateData: Record<string, any> = { updatedBy: userId };

      const scalarFields = [
        "name", "info", "description",
        "categorie", "subcategorie", "magasin", "brand",
        "stock", "price", "tva", "discount",
        "stockStatus", "statuspage", "vadmin",
      ] as const;

      const nullableIds = ["subcategorie", "magasin", "brand"] as const;

      for (const field of scalarFields) {
        const raw = (req.body as any)[field];
        if (raw === undefined) continue;

        if (["stock", "price", "tva", "discount"].includes(field)) {
          const num = parseFloat(raw);
          if (Number.isFinite(num)) updateData[field] = num;
          continue;
        }

        if (nullableIds.includes(field as any)) {
          updateData[field] = raw === "" || raw === "null" ? null : String(raw).trim();
          continue;
        }

        updateData[field] = typeof raw === "string" ? raw.trim() : raw;
      }

      /* ------------------------------------------------------------------ */
      /* 2) MAIN IMAGE HANDLING                                             */
      /* ------------------------------------------------------------------ */
      const mainFile = (req.files as any)?.mainImage?.[0];
      if (mainFile) {
        const up = await uploadToCloudinary(mainFile, "products/main");
        if (existingProduct.mainImageId)
          await cloudinary.uploader.destroy(existingProduct.mainImageId).catch(() => null);
        updateData.mainImageUrl = up.secureUrl;
        updateData.mainImageId  = up.publicId;
      } else if ("removeMain" in req.body && existingProduct.mainImageId) {
        await cloudinary.uploader.destroy(existingProduct.mainImageId).catch(() => null);
        updateData.mainImageUrl = undefined;
        updateData.mainImageId  = undefined;
      }

      /* ------------------------------------------------------------------ */
      /* 3) EXTRA IMAGES (add / delete)                                     */
      /* ------------------------------------------------------------------ */
      const remainingExtraUrls = parseJson<string[]>(req.body.remainingExtraUrls, []);
      const removedExtraUrls   = parseJson<string[]>(req.body.removedExtraUrls, []);

      await Promise.all(
        removedExtraUrls.map((u) => {
          const id = extractPublicId(u);
          return cloudinary.uploader.destroy(id).catch(() => null);
        })
      );

      const extraFiles = (req.files as any)?.extraImages ?? [];
      const newExtraUrls: string[] = [];
      for (const f of extraFiles) {
        const up = await uploadToCloudinary(f, "products/extra");
        newExtraUrls.push(up.secureUrl);
      }

      if (remainingExtraUrls.length || newExtraUrls.length) {
        updateData.extraImagesUrl = [...remainingExtraUrls, ...newExtraUrls];
      } else if (removedExtraUrls.length && !extraFiles.length) {
        updateData.extraImagesUrl = [];
      }

      /* ------------------------------------------------------------------ */
      /* 4) ATTRIBUTES + ATTRIBUTE IMAGES (always honor body if present)    */
      /* ------------------------------------------------------------------ */
      const attrFiles = (req.files as any)?.attributeImages ?? [];
      const bodyAttrs =
        req.body.attributes !== undefined
          ? parseJson<
              Array<{
                attributeSelected: string;
                value?:
                  | string
                  | Array<{ name: string; value?: string; hex?: string; image?: string | null; imageId?: string | null }>;
              }>
            >(req.body.attributes, [])
          : null;

      // Start from body if provided; otherwise from existing document.
      const workingAttrs: Array<any> =
        bodyAttrs ?? (existingProduct.attributes ? JSON.parse(JSON.stringify(existingProduct.attributes)) : []);

      // If UI asked to clear any attribute image by sending image=null, perform deletion
      if (bodyAttrs) {
        for (let aIdx = 0; aIdx < bodyAttrs.length; aIdx++) {
          const row = bodyAttrs[aIdx];
          if (Array.isArray(row?.value)) {
            for (let vIdx = 0; vIdx < row.value.length; vIdx++) {
              const v = row.value[vIdx] as any;
              if (v && v.image === null) {
                const cur = existingProduct.attributes?.[aIdx]?.value as any[];
                const curItem = Array.isArray(cur) ? cur[vIdx] : undefined;
                if (curItem?.imageId) {
                  await cloudinary.uploader.destroy(curItem.imageId).catch(() => null);
                }
                // Remove image fields in the outgoing payload
                delete workingAttrs[aIdx].value[vIdx].image;
                delete workingAttrs[aIdx].value[vIdx].imageId;
              }
            }
          }
        }
      }

      // Overlay uploaded images by index on top of workingAttrs
      if (attrFiles.length) {
        for (const f of attrFiles) {
          // originalname must be: "attributeImages-<a>-<v>"
          const m = String(f.originalname || "").match(/^attributeImages-(\d+)-(\d+)$/);
          if (!m) continue;
          const idxA = Number(m[1]);
          const idxV = Number(m[2]);
          if (!workingAttrs[idxA]) continue;

          const up = await uploadToCloudinary(f, `products/attr/${productId}`);
          if (Array.isArray(workingAttrs[idxA].value)) {
            if (!workingAttrs[idxA].value[idxV]) continue;
            workingAttrs[idxA].value[idxV].image   = up.secureUrl;
            workingAttrs[idxA].value[idxV].imageId = up.publicId;
          }
        }
      }

      if (bodyAttrs || attrFiles.length) {
        updateData.attributes = workingAttrs;
      }

      /* ------------------------------------------------------------------ */
      /* 5) PRODUCT DETAILS + DETAIL IMAGES                                 */
      /* ------------------------------------------------------------------ */
      if (req.body.productDetails !== undefined) {
        const detailsJson = parseJson<
          Array<{ name: string; description?: string; image?: string | null; imageId?: string | null }>
        >(req.body.productDetails, []);

        const detailFiles = (req.files as any)?.detailsImages ?? [];

        const processed = await Promise.all(
          detailsJson.map(async (d, idx) => {
            d.name = d.name.trim();
            if (d.description) d.description = d.description.trim();

            const cur = existingProduct.productDetails?.[idx];

            const expectedName = `detailsImages-${idx}`;
            const newFile = detailFiles.find(
              (f: any) => String(f.originalname || "") === expectedName
            );

            if (newFile) {
              const up = await uploadToCloudinary(newFile, `products/details/${productId}`);
              if (cur?.imageId) await cloudinary.uploader.destroy(cur.imageId).catch(() => null);
              d.image   = up.secureUrl;
              d.imageId = up.publicId;
            } else if (d.image === null) {
              if (cur?.imageId) await cloudinary.uploader.destroy(cur.imageId).catch(() => null);
              delete d.image;
              delete d.imageId;
            } else if (cur) {
              d.image   = cur.image;
              d.imageId = cur.imageId;
            }

            return d;
          })
        );

        updateData.productDetails = processed;
      }

      /* ------------------------------------------------------------------ */
      /* 6) FINAL WRITE                                                     */
      /* ------------------------------------------------------------------ */
      const updated = await Product.findByIdAndUpdate(productId, updateData, {
        new: true,
        runValidators: true,
      });

      res.json({ message: "Product updated successfully.", product: updated });
    } catch (err: any) {
      console.error("Update Product Error:", err);
      if (err.code === 11000) {
        res.status(400).json({ message: "Unique field conflict." });
      } else if (err.name === "ValidationError") {
        const msgs = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ message: msgs.join(" ") });
      } else {
        res.status(500).json({ message: "Internal server error." });
      }
    }
  }
);

export default router;
