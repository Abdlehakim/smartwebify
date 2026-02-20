// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/stock/allproducts/createProduct.ts
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const router = Router();

/* ------------------------------------------------------------------ */
/*  POST /api/dashboardadmin/stock/products/create                    */
/* ------------------------------------------------------------------ */
router.post(
  "/create",
  requirePermission("M_Stock"),
  memoryUpload.fields([
    { name: "mainImage",       maxCount: 1  },
    { name: "extraImages",     maxCount: 10 },
    { name: "attributeImages", maxCount: 30 },
    { name: "detailsImages",   maxCount: 10 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      /* ------------------------------------------------------------ */
      /* 0) auth                                                      */
      /* ------------------------------------------------------------ */
      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      /* ------------------------------------------------------------ */
      /* 1) scalar / enum fields                                      */
      /* ------------------------------------------------------------ */
      const name         = ((req.body.name        as string) || "").trim();
      const info         = ((req.body.info        as string) || "").trim();
      const description  = ((req.body.description as string) || "").trim();
      const categorie    = req.body.categorie as string;
      const subcategorie = (req.body.subcategorie as string) || null;
      const magasin      = (req.body.magasin      as string) || null;
      const brand        = (req.body.brand        as string) || null;

      const stock        = parseInt(req.body.stock as string, 10)  || 0;
      const price        = parseFloat(req.body.price    as string) || 0;
      const tva          = parseFloat(req.body.tva      as string) || 0;
      const discount     = parseFloat(req.body.discount as string) || 0;

      const stockStatus  = ((req.body.stockStatus as string) || "in stock").trim();
      const statuspage   = ((req.body.statuspage  as string) || "none").trim();
      const vadmin       = ((req.body.vadmin      as string) || "not-approve").trim();

      /* ------------------------------------------------------------ */
      /* 2) attributes  (+ attributeImages)                           */
      /* ------------------------------------------------------------ */
      let attributes: { attributeSelected: string; value: any }[] = [];

      if (req.body.attributes !== undefined) {
        try {
          const raw = JSON.parse(req.body.attributes as string);

          if (!Array.isArray(raw)) {
            res.status(400).json({ success: false, message: "Invalid JSON for attributes" });
            return;
          }

          const attrFiles = (req.files as any)?.attributeImages || [];

          const mapped = await Promise.all(
            raw.map(
              async (
                attr: { attributeSelected?: string; definition?: string; value: any },
                aIdx: number
              ) => {
                // accept either attributeSelected (new) or definition (old)
                const id = ((attr.attributeSelected ?? attr.definition ?? "") as string).trim();
                if (!id) return null; // skip blanks to avoid Mongoose "required" error

                let processed = attr.value;

                if (Array.isArray(processed)) {
                  processed = await Promise.all(
                    processed.map(async (row: any, vIdx: number) => {
                      // match by originalname set in the frontend: attributeImages-${aIdx}-${vIdx}
                      const file = attrFiles.find(
                        (f: any) => f.originalname === `attributeImages-${aIdx}-${vIdx}`
                      );
                      if (file) {
                        const up = await uploadToCloudinary(file, "products/attributes");
                        row.image = up.secureUrl;
                        row.imageId = up.publicId;
                      }
                      return row;
                    })
                  );
                }

                return {
                  attributeSelected: id,
                  value: processed,
                };
              }
            )
          );

          attributes = (mapped.filter(Boolean) as { attributeSelected: string; value: any }[]);
        } catch {
          res.status(400).json({ success: false, message: "Invalid JSON for attributes" });
          return;
        }
      }

      /* ------------------------------------------------------------ */
      /* 3) productDetails (+ detailsImages)                          */
      /* ------------------------------------------------------------ */
      let productDetails: {
        name: string;
        description?: string;
        image?: string;
        imageId?: string;
      }[] = [];

      if (req.body.productDetails !== undefined) {
        try {
          const raw = JSON.parse(req.body.productDetails as string);
          const files = (req.files as any)?.detailsImages || [];

          productDetails = await Promise.all(
            raw.map(
              async (
                d: {
                  name: string;
                  description?: string;
                  image?: string;
                  imageId?: string;
                },
                idx: number
              ) => {
                if (!d?.name || !d.name.trim()) return null; // skip blank rows

                d.name = d.name.trim();
                if (d.description) d.description = d.description.trim();

                // match by originalname set in the front-end
                const file = files.find(
                  (f: any) => f.originalname === `detailsImages-${idx}`
                );

                if (file) {
                  const up = await uploadToCloudinary(file, "products/details");
                  d.image = up.secureUrl;
                  d.imageId = up.publicId;
                }

                return d;
              }
            )
          ).then((arr) => arr.filter(Boolean) as NonNullable<(typeof arr)[number]>[]);
        } catch {
          res
            .status(400)
            .json({ success: false, message: "Invalid JSON for productDetails" });
          return;
        }
      }

      /* ------------------------------------------------------------ */
      /* 4) main & extra images                                       */
      /* ------------------------------------------------------------ */
      let mainImageUrl: string | null = null;
      let mainImageId:  string | null = null;

      if ((req.files as any)?.mainImage?.[0]) {
        const up = await uploadToCloudinary(
          (req.files as any).mainImage[0],
          "products"
        );
        mainImageUrl = up.secureUrl;
        mainImageId  = up.publicId;
      }

      const extraImagesUrl: string[] = [];
      const extraImagesId:  string[] = [];

      if ((req.files as any)?.extraImages?.length) {
        for (const file of (req.files as any).extraImages as Express.Multer.File[]) {
          const up = await uploadToCloudinary(file, "products");
          extraImagesUrl.push(up.secureUrl);
          extraImagesId .push(up.publicId);
        }
      }

      /* ------------------------------------------------------------ */
      /* 5) save the product                                          */
      /* ------------------------------------------------------------ */
      const product = await Product.create({
        name,
        info,
        description,
        categorie,
        subcategorie,
        magasin,
        brand,
        stock,
        price,
        tva,
        discount,
        stockStatus,
        statuspage,
        vadmin,
        mainImageUrl,
        mainImageId,
        extraImagesUrl,
        extraImagesId,
        createdBy: userId,
        attributes,
        productDetails,
      });

      res
        .status(201)
        .json({ success: true, message: "Product created.", product });
    } catch (err: any) {
      console.error("Create Product Error:", err);

      if (err.code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "Duplicate reference or slug." });
      } else if (err.name === "ValidationError") {
        const msgs = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(" ") });
      } else {
        res
          .status(500)
          .json({ success: false, message: err.message || "Server error." });
      }
    }
  }
);

export default router;
