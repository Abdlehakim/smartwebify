// routes/dashboardadmin/blog/postsubcategorie/updatePostSubcategorie.ts

import { Router, Request, Response } from "express";
import PostSubCategorie, { IPostSubCategorie } from "@/models/blog/PostSubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * PUT /api/dashboardadmin/blog/postsubcategorie/update/:postSubcategorieId
 * — updates name and/or vadmin, replaces icon/image/banner if provided,
 *    and stamps updatedBy
 */
router.put(
  "/update/:postSubcategorieId",
  requirePermission("M_Blog"),
  memoryUpload.fields([
    { name: "icon",   maxCount: 1 },
    { name: "image",  maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { postSubcategorieId } = req.params;
    const userId = req.dashboardUser?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      // 1) load existing
      const existing = await PostSubCategorie.findById(postSubcategorieId);
      if (!existing) {
        res.status(404).json({ success: false, message: "Post sub-categorie not found." });
        return;
      }

      // 2) build updates
      const updateData: Partial<IPostSubCategorie> = { updatedBy: userId };
      const { name, vadmin } = req.body as { name?: string; vadmin?: string };

      if (typeof name === "string") {
        updateData.name = name.trim();
      }
      if (typeof vadmin === "string") {
        updateData.vadmin = vadmin as "approve" | "not-approve";
      }

      // 3) replace icon if provided
      const iconFile = (req.files as any)?.icon?.[0];
      if (iconFile) {
        if (existing.iconId) {
          try {
            await cloudinary.uploader.destroy(existing.iconId);
          } catch (err) {
            console.error("Cloudinary icon deletion error:", err);
          }
        }
        const uploadedIcon = await uploadToCloudinary(iconFile, "postSubCategories");
        updateData.iconUrl = uploadedIcon.secureUrl;
        updateData.iconId  = uploadedIcon.publicId;
      }

      // 4) replace image if provided
      const imageFile = (req.files as any)?.image?.[0];
      if (imageFile) {
        if (existing.imageId) {
          try {
            await cloudinary.uploader.destroy(existing.imageId);
          } catch (err) {
            console.error("Cloudinary image deletion error:", err);
          }
        }
        const uploadedImage = await uploadToCloudinary(imageFile, "postSubCategories");
        updateData.imageUrl = uploadedImage.secureUrl;
        updateData.imageId  = uploadedImage.publicId;
      }

      // 5) replace banner if provided
      const bannerFile = (req.files as any)?.banner?.[0];
      if (bannerFile) {
        if (existing.bannerId) {
          try {
            await cloudinary.uploader.destroy(existing.bannerId);
          } catch (err) {
            console.error("Cloudinary banner deletion error:", err);
          }
        }
        const uploadedBanner = await uploadToCloudinary(bannerFile, "postSubCategories");
        updateData.bannerUrl = uploadedBanner.secureUrl;
        updateData.bannerId  = uploadedBanner.publicId;
      }

      // 6) apply update
      const updated = await PostSubCategorie.findByIdAndUpdate(
        postSubcategorieId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updated) {
        res.status(404).json({
          success: false,
          message: "Post sub-categorie not found after update."
        });
        return;
      }

      res.json({
        success: true,
        message: "Post sub-categorie updated successfully.",
        postSubcategorie: updated,
      });
    } catch (err: any) {
      console.error("Update PostSubcategorie Error:", err);
      if (err.code === 11000) {
        res.status(400).json({
          success: false,
          message: "Another sub-categorie with that name already exists."
        });
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
