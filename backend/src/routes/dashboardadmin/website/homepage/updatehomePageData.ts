// routes/dashboardadmin/website/homepage/updatehomePageData.ts

import { Router, Request, Response } from "express";
import homePageData, { IhomePageData } from "@/models/websitedata/homePageData";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * PUT /api/dashboardadmin/homepage/updatehomePageData/:id
 * — updates fields on a homePageData document, replaces banner if provided
 */
router.put(
  "/updatehomePageData/:id",
  requirePermission("M_WebsiteData"),
  memoryUpload.single("banner"),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.dashboardUser?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      // 1) load existing
      const existing = await homePageData.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: "HomePageData not found." });
        return;
      }

      // 2) build updateData using schema field names
      const updateData: Partial<IhomePageData> = {};

      const {
        HPbannerTitle,
        HPcategorieTitle,
        HPcategorieSubTitle,
        HPbrandTitle,
        HPbrandSubTitle,
        HPmagasinTitle,
        HPmagasinSubTitle,
        HPNewProductTitle,
        HPNewProductSubTitle,
        HPPromotionTitle,
        HPPromotionSubTitle,
        HPBestCollectionTitle,
        HPBestCollectionSubTitle,
      } = req.body as Partial<IhomePageData>;

      if (typeof HPbannerTitle === "string")         updateData.HPbannerTitle = HPbannerTitle.trim();
      if (typeof HPcategorieTitle === "string")      updateData.HPcategorieTitle = HPcategorieTitle.trim();
      if (typeof HPcategorieSubTitle === "string")   updateData.HPcategorieSubTitle = HPcategorieSubTitle.trim();
      if (typeof HPbrandTitle === "string")          updateData.HPbrandTitle = HPbrandTitle.trim();
      if (typeof HPbrandSubTitle === "string")       updateData.HPbrandSubTitle = HPbrandSubTitle.trim();
      if (typeof HPmagasinTitle === "string")       updateData.HPmagasinTitle = HPmagasinTitle.trim();
      if (typeof HPmagasinSubTitle === "string")    updateData.HPmagasinSubTitle = HPmagasinSubTitle.trim();
      if (typeof HPNewProductTitle === "string")     updateData.HPNewProductTitle = HPNewProductTitle.trim();
      if (typeof HPNewProductSubTitle === "string")  updateData.HPNewProductSubTitle = HPNewProductSubTitle.trim();
      if (typeof HPPromotionTitle === "string")      updateData.HPPromotionTitle = HPPromotionTitle.trim();
      if (typeof HPPromotionSubTitle === "string")   updateData.HPPromotionSubTitle = HPPromotionSubTitle.trim();
      if (typeof HPBestCollectionTitle === "string") updateData.HPBestCollectionTitle = HPBestCollectionTitle.trim();
      if (typeof HPBestCollectionSubTitle === "string")
                                                    updateData.HPBestCollectionSubTitle = HPBestCollectionSubTitle.trim();

      // 3) replace banner if new file
      if (req.file) {
        if (existing.HPbannerImgId) {
          try {
            await cloudinary.uploader.destroy(existing.HPbannerImgId);
          } catch (err) {
            console.error("Cloudinary banner deletion error:", err);
          }
        }
        const { secureUrl, publicId } = await uploadToCloudinary(req.file, "homepage");
        updateData.HPbannerImgUrl = secureUrl;
        updateData.HPbannerImgId = publicId;
      }

      // 4) apply update
      const updated = await homePageData.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updated) {
        res.status(404).json({ success: false, message: "HomePageData not found after update." });
        return;
      }

      res.json({
        success: true,
        message: "Home page data updated successfully.",
        homePageData: updated,
      });
    } catch (err: unknown) {
      console.error("Update HomePageData Error:", err);

      if (
        err instanceof Error &&
        (err as any).name === "ValidationError" &&
        (err as any).errors
      ) {
        const msgs = Object.values((err as any).errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(" ") });
      } else {
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    }
  }
);

export default router;
