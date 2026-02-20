// routes/dashboardadmin/blog/postcategorie/updatePostCategorie.ts

import { Router, Request, Response } from "express";
import PostCategorie, { IPostCategorie } from "@/models/blog/PostCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * PUT /api/dashboardadmin/blog/postcategorie/update/:postCategorieId
 * — updates fields on a PostCategorie, replaces icon/image/banner if provided,
 *    and stamps updatedBy
 */
router.put(
  "/update/:postCategorieId",
  requirePermission("M_Blog"),
  memoryUpload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { postCategorieId } = req.params;
    const userId = req.dashboardUser?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      // 1) load existing
      const existing = await PostCategorie.findById(postCategorieId);
      if (!existing) {
        res.status(404).json({ success: false, message: "Post categorie not found." });
        return;
      }

      // 2) build updates
      const updateData: Partial<IPostCategorie> = { updatedBy: userId };

      const { name, vadmin } = req.body as {
        name?: string;
        vadmin?: string;
      };

      if (typeof name === "string") {
        updateData.name = name.trim();
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
        const uploadedIcon = await uploadToCloudinary(iconFile, "postCategories");
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
        const uploadedImage = await uploadToCloudinary(imageFile, "postCategories");
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
        const uploadedBanner = await uploadToCloudinary(bannerFile, "postCategories");
        updateData.bannerUrl = uploadedBanner.secureUrl;
        updateData.bannerId = uploadedBanner.publicId;
      }

      // 6) apply update
      const updated = await PostCategorie.findByIdAndUpdate(
        postCategorieId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updated) {
        res
          .status(404)
          .json({ success: false, message: "Post categorie not found after update." });
        return;
      }

      res.json({
        success: true,
        message: "Post categorie updated successfully.",
        postCategorie: updated,
      });
    } catch (err: any) {
      console.error("Update PostCategorie Error:", err);
      if (err.code === 11000) {
        res.status(400).json({
          success: false,
          message: "Another post categorie with that name already exists.",
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
