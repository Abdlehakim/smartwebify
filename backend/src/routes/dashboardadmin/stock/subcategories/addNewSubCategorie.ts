// src/pages/api/dashboardadmin/stock/subcategories/create.ts

import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import SubCategorie, { ISubCategorie } from "@/models/stock/SubCategorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const router = Router();

/**
 * POST /api/dashboardadmin/stock/subcategories/create
 * — accepts optional “icon”, “image” and “banner” file uploads,
 *   stores them in Cloudinary (folder “subcategories”),
 *   and creates a new SubCategorie document.
 */
router.post(
  "/create",
  requirePermission("M_Stock"),
  memoryUpload.fields([
    { name: "icon", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const name = ((req.body.name as string) || "").trim();
      const categorieId = (req.body.categorie as string) || "";
      if (!name || !categorieId) {
        res
          .status(400)
          .json({ success: false, message: "Both name and categorie are required." });
        return;
      }

      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      // Upload files if provided
      let iconUrl: string | undefined, iconId: string | undefined;
      let imageUrl: string | undefined, imageId: string | undefined;
      let bannerUrl: string | undefined, bannerId: string | undefined;
      const files = req.files as Record<string, Express.Multer.File[]>;

      if (files.icon?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(files.icon[0], "subcategories");
        iconUrl = secureUrl;
        iconId = publicId;
      }
      if (files.image?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(files.image[0], "subcategories");
        imageUrl = secureUrl;
        imageId = publicId;
      }
      if (files.banner?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(files.banner[0], "subcategories");
        bannerUrl = secureUrl;
        bannerId = publicId;
      }

      // Create new subcategory
      const newSub = await SubCategorie.create({
        name,
        categorie: new mongoose.Types.ObjectId(categorieId),
        iconUrl,
        iconId,
        imageUrl,
        imageId,
        bannerUrl,
        bannerId,
        createdBy: new mongoose.Types.ObjectId(userId),
      } as unknown as Partial<ISubCategorie>);

      res.status(201).json({
        success: true,
        message: "Sub-categorie created successfully.",
        subCategorie: newSub,
      });
    } catch (err: any) {
      console.error("Create Sub-Categorie Error:", err);
      if (err.code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "A sub-categorie with that name already exists." });
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
