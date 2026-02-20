// routes/dashboardadmin/website/homepage/createhomePageData.tsx

import { Router, Request, Response } from "express";
import homePageData, { IhomePageData } from "@/models/websitedata/homePageData";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const router = Router();

/**
 * POST /api/dashboardadmin/homepage/createhomePageData
 * — accepts optional “banner” file upload,
 *   stores it in Cloudinary (folder “homepage”),
 *   and creates a new homePageData document.
 *   Rejects if one already exists, and handles unique-field errors.
 */
router.post(
  "/createhomePageData",
  requirePermission("M_WebsiteData"),
  memoryUpload.single("banner"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Prevent more than one document
      const existingCount = await homePageData.estimatedDocumentCount();
      if (existingCount > 0) {
        res.status(400).json({
          success: false,
          message: "Home page data already exists. Please update the existing entry.",
        });
        return;
      }

      // Destructure schema fields
      const {
        HPbannerTitle = "",
        HPcategorieTitle = "",
        HPcategorieSubTitle = "",
        HPbrandTitle = "",
        HPbrandSubTitle = "",
        HPmagasinTitle = "",
        HPmagasinSubTitle = "",
        HPNewProductTitle = "",
        HPNewProductSubTitle = "",
        HPPromotionTitle = "",
        HPPromotionSubTitle = "",
        HPBestCollectionTitle = "",
        HPBestCollectionSubTitle = "",
      } = req.body as Partial<IhomePageData>;

      // Validate required text fields
      const required = [
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
      ];
      if (required.some((f) => !f?.trim())) {
        res.status(400).json({
          success: false,
          message: "All title and subtitle fields are required.",
        });
        return;
      }

      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      // Handle banner upload
      let HPbannerImgUrl: string | undefined;
      let HPbannerImgId: string | undefined;
      if (req.file) {
        const { secureUrl, publicId } = await uploadToCloudinary(
          req.file,
          "homepage"
        );
        HPbannerImgUrl = secureUrl;
        HPbannerImgId = publicId;
      }

      // Create the single document
      const created = await homePageData.create({
        HPbannerImgUrl,
        HPbannerImgId,
        HPbannerTitle: HPbannerTitle.trim(),
        HPcategorieTitle: HPcategorieTitle.trim(),
        HPcategorieSubTitle: HPcategorieSubTitle.trim(),
        HPbrandTitle: HPbrandTitle.trim(),
        HPbrandSubTitle: HPbrandSubTitle.trim(),
        HPmagasinTitle: HPmagasinTitle.trim(),
        HPmagasinSubTitle: HPmagasinSubTitle.trim(),
        HPNewProductTitle: HPNewProductTitle.trim(),
        HPNewProductSubTitle: HPNewProductSubTitle.trim(),
        HPPromotionTitle: HPPromotionTitle.trim(),
        HPPromotionSubTitle: HPPromotionSubTitle.trim(),
        HPBestCollectionTitle: HPBestCollectionTitle.trim(),
        HPBestCollectionSubTitle: HPBestCollectionSubTitle.trim(),
      });

      res.status(201).json({
        success: true,
        message: "Home page data created successfully.",
        homePageData: created,
      });
    } catch (err: unknown) {
      console.error("Create HomePageData Error:", err);

      // Duplicate key error (unique constraint)
      if ((err as any).code === 11000) {
        res.status(400).json({
          success: false,
          message: "One of the fields must be unique — that value is already in use.",
        });
        return;
      }

      // Mongoose validation errors
      if (
        err instanceof Error &&
        (err as any).name === "ValidationError" &&
        (err as any).errors
      ) {
        const msgs = Object.values((err as any).errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(" ") });
        return;
      }

      // Fallback
      res.status(500).json({
        success: false,
        message: err instanceof Error ? err.message : "Internal server error.",
      });
    }
  }
);

export default router;
