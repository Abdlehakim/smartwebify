//dashboardadmin/stock/categories/updateCategorie.ts

import { Router, Request, Response } from "express";
import Categorie, { ICategorie } from "@/models/stock/Categorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * PUT /api/dashboardadmin/stock/categories/update/:categorieId
 * — updates fields on a Categorie, replaces icon/image/banner if provided,
 *    and stamps updatedBy
 */
router.put(
  "/update/:categorieId",
  requirePermission("M_Stock"),
  memoryUpload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { categorieId } = req.params;
    const userId = req.dashboardUser?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      // 1) load existing
      const existing = await Categorie.findById(categorieId);
      if (!existing) {
        res.status(404).json({ success: false, message: "Categorie not found." });
        return;
      }

      // 2) build updates
      const updateData: Partial<ICategorie> = { updatedBy: userId };

      const {
        name,
        slug,
        vadmin,
      } = req.body as {
        name?: string;
        slug?: string;
        vadmin?: string;
      };

      if (typeof name === "string") {
        updateData.name = name.trim();
      }
      if (typeof slug === "string") {
        updateData.slug = slug.trim();
      }
      if (typeof vadmin === "string") {
        updateData.vadmin = vadmin as "approve" | "not-approve";
      }

      // 3) replace icon if new file
      const iconFile = (req.files as any)?.icon?.[0];
      if (iconFile) {
        if (existing.iconId) {
          try {
            await cloudinary.uploader.destroy(existing.iconId);
          } catch (err) {
            console.error("Cloudinary icon deletion error:", err);
          }
        }
        const uploadedIcon = await uploadToCloudinary(iconFile, "categories");
        updateData.iconUrl = uploadedIcon.secureUrl;
        updateData.iconId = uploadedIcon.publicId;
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
        const uploadedImage = await uploadToCloudinary(imageFile, "categories");
        updateData.imageUrl = uploadedImage.secureUrl;
        updateData.imageId = uploadedImage.publicId;
      }

      // 5) replace banner if new file
      const bannerFile = (req.files as any)?.banner?.[0];
      if (bannerFile) {
        if (existing.bannerId) {
          try {
            await cloudinary.uploader.destroy(existing.bannerId);
          } catch (err) {
            console.error("Cloudinary banner deletion error:", err);
          }
        }
        const uploadedBanner = await uploadToCloudinary(bannerFile, "categories");
        updateData.bannerUrl = uploadedBanner.secureUrl;
        updateData.bannerId = uploadedBanner.publicId;
      }

      // 6) apply update
      const updatedCat = await Categorie.findByIdAndUpdate(
        categorieId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updatedCat) {
        res.status(404).json({ success: false, message: "Categorie not found after update." });
        return;
      }

      res.json({
        success: true,
        message: "Categorie updated successfully.",
        categorie: updatedCat,
      });
    } catch (err: any) {
      console.error("Update Categorie Error:", err);
      if (err.code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "Another category with that name already exists." });
      } else if (err.name === "ValidationError" && err.errors) {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: messages.join(" ") });
      } else {
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    }
  }
);

export default router;
