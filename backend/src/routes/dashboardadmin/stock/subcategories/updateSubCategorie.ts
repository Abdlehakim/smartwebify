// routes/dashboardadmin/stock/subcategories/updateSubCategorie.ts

import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import SubCategorie, { ISubCategorie } from "@/models/stock/SubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * PUT /api/dashboardadmin/stock/subcategories/update/:subCatId
 * — updates fields on a SubCategorie, replaces icon/image/banner if provided,
 *   and stamps updatedBy
 */
router.put(
  "/update/:subCatId",
  requirePermission("M_Stock"),
  memoryUpload.fields([
    { name: "icon",   maxCount: 1 },
    { name: "image",  maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { subCatId } = req.params;
    const userId = req.dashboardUser?._id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
    } else {
      try {
        // 1) load existing
        const existing = await SubCategorie.findById(subCatId);
        if (!existing) {
          res.status(404).json({ success: false, message: "Sub-categorie not found." });
        } else {
          // 2) build updates
          const updateData: Partial<ISubCategorie> = { updatedBy: userId };

          const {
            name,
            slug,
            vadmin,
            categorie,
          } = req.body as {
            name?: string;
            slug?: string;
            vadmin?: string;
            categorie?: string;
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
          if (typeof categorie === "string") {
            updateData.categorie = new mongoose.Types.ObjectId(categorie);
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
            const uploadedIcon = await uploadToCloudinary(iconFile, "subcategories");
            updateData.iconUrl = uploadedIcon.secureUrl;
            updateData.iconId  = uploadedIcon.publicId;
          }

          // 4) replace image if new file
          const imageFile = (req.files as any)?.image?.[0];
          if (imageFile) {
            if (existing.imageId) {
              try {
                await cloudinary.uploader.destroy(existing.imageId);
              } catch (err) {
                console.error("Cloudinary image deletion error:", err);
              }
            }
            const uploadedImage = await uploadToCloudinary(imageFile, "subcategories");
            updateData.imageUrl = uploadedImage.secureUrl;
            updateData.imageId  = uploadedImage.publicId;
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
            const uploadedBanner = await uploadToCloudinary(bannerFile, "subcategories");
            updateData.bannerUrl = uploadedBanner.secureUrl;
            updateData.bannerId  = uploadedBanner.publicId;
          }

          // 6) apply update
          const updatedSubCat = await SubCategorie.findByIdAndUpdate(
            subCatId,
            updateData,
            { new: true, runValidators: true }
          );

          if (!updatedSubCat) {
            res
              .status(404)
              .json({ success: false, message: "Sub-categorie not found after update." });
          } else {
            res.json({
              success: true,
              message: "Sub-categorie updated successfully.",
              subCategorie: updatedSubCat,
            });
          }
        }
      } catch (err: any) {
        console.error("Update Sub-Categorie Error:", err);
        if (err.code === 11000) {
          res
            .status(400)
            .json({
              success: false,
              message: "Another sub-categorie with that name already exists.",
            });
        } else if (err.name === "ValidationError" && err.errors) {
          const messages = Object.values(err.errors).map((e: any) => e.message);
          res.status(400).json({ success: false, message: messages.join(" ") });
        } else {
          res.status(500).json({ success: false, message: "Internal server error." });
        }
      }
    }
  }
);

export default router;
