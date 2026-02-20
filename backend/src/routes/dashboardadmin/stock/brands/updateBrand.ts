// src/pages/api/dashboardadmin/stock/brands/updateBrand.ts

import { Router, Request, Response } from "express";
import Brand, { IBrand } from "@/models/stock/Brand";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * PUT /api/dashboardadmin/stock/brands/update/:brandId
 * — updates fields on a Brand, replaces logo/image if provided,
 *   and stamps updatedBy
 */
router.put(
  "/update/:brandId",
  requirePermission("M_Stock"),
  memoryUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { brandId } = req.params;
    const userId = req.dashboardUser?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      // 1) load existing
      const existing = await Brand.findById(brandId);
      if (!existing) {
        res.status(404).json({ success: false, message: "Brand not found." });
        return;
      }

      // 2) build updates
      const updateData: Partial<IBrand> = { updatedBy: userId };

      const {
        name,
        place,
        description,
        vadmin,
      } = req.body as {
        name?: string;
        place?: string;
        description?: string;
        vadmin?: string;
      };

      if (typeof name === "string") {
        updateData.name = name.trim();
      }
      if (typeof place === "string") {
        updateData.place = place.trim();
      }
      if (typeof description === "string") {
        updateData.description = description.trim() || null;
      }
      if (typeof vadmin === "string") {
        updateData.vadmin = vadmin as "approve" | "not-approve";
      }

      // 3) replace logo if new file
      const logoFile = (req.files as any)?.logo?.[0];
      if (logoFile) {
        if (existing.logoId) {
          try {
            await cloudinary.uploader.destroy(existing.logoId);
          } catch (err) {
            console.error("Cloudinary logo deletion error:", err);
          }
        }
        const uploadedLogo = await uploadToCloudinary(logoFile, "brands");
        updateData.logoUrl = uploadedLogo.secureUrl;
        updateData.logoId  = uploadedLogo.publicId;
      }

      // 4) replace main image if new file
      const imageFile = (req.files as any)?.image?.[0];
      if (imageFile) {
        if (existing.imageId) {
          try {
            await cloudinary.uploader.destroy(existing.imageId);
          } catch (err) {
            console.error("Cloudinary image deletion error:", err);
          }
        }
        const uploadedImage = await uploadToCloudinary(imageFile, "brands");
        updateData.imageUrl = uploadedImage.secureUrl;
        updateData.imageId  = uploadedImage.publicId;
      }

      // 5) apply update
      const updatedBrand = await Brand.findByIdAndUpdate(
        brandId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedBrand) {
        res
          .status(404)
          .json({ success: false, message: "Brand not found after update." });
        return;
      }

      res.json({
        success: true,
        message: "Brand updated successfully.",
        brand:   updatedBrand,
      });
    } catch (err: any) {
      console.error("Update Brand Error:", err);
      if (err.code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "Another brand with that name already exists." });
      } else if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: messages.join(" ") });
      } else {
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    }
  }
);

export default router;
