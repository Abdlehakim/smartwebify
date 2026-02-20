// routes/dashboardadmin/stock/allproducts/deleteProduct.ts

import { Router, Request, Response } from "express";
import Product from "@/models/stock/Product";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * DELETE /api/dashboardadmin/stock/products/delete/:productId
 *
 * • Removes the product document
 * • Cleans up every image stored on Cloudinary:
 *     – mainImageId
 *     – extraImagesId[]
 *     – productDetails[].imageId
 *     – attributes[].value[?].imageId
 */
router.delete(
  "/delete/:productId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { productId } = req.params;

      /* ------------------------------------------------------------------ */
      /* 1) Load product (needed to collect all Cloudinary public IDs)       */
      /* ------------------------------------------------------------------ */
      const existing = await Product.findById(productId).lean();
      if (!existing) {
        res.status(404).json({ message: "Product not found." });
        return;
      }

      /* ------------------------------------------------------------------ */
      /* 2) Collect every publicId that needs removal                        */
      /* ------------------------------------------------------------------ */
      const idsToDelete = new Set<string>();

      /* main image */
      if (existing.mainImageId) idsToDelete.add(existing.mainImageId);

      /* extra images */
      (existing.extraImagesId || []).forEach((id) => id && idsToDelete.add(id));

      /* product-details images */
      (existing.productDetails || []).forEach((d: any) => {
        if (d?.imageId) idsToDelete.add(d.imageId);
      });

      /* attribute images */
      (existing.attributes || []).forEach((attr: any) => {
        const v = attr?.value;
        if (!v) return;

        if (Array.isArray(v)) {
          v.forEach((item: any) => {
            if (item?.imageId) idsToDelete.add(item.imageId);
          });
        } else if (typeof v === "object" && v.imageId) {
          idsToDelete.add(v.imageId);
        }
      });

      /* ------------------------------------------------------------------ */
      /* 3) Delete images from Cloudinary (best-effort)                      */
      /* ------------------------------------------------------------------ */
      await Promise.all(
        [...idsToDelete].map(async (publicId) => {
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.warn(`⚠️  Failed to delete image (${publicId}):`, err);
          }
        })
      );

      /* ------------------------------------------------------------------ */
      /* 4) Delete product document                                         */
      /* ------------------------------------------------------------------ */
      await Product.findByIdAndDelete(productId);

      res.json({ message: "Product deleted successfully." });
    } catch (err) {
      console.error("Delete Product Error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
