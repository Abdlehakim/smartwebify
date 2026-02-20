// routes/dashboardadmin/stock/categories/create.ts

import { Router, Request, Response } from "express";
import path from "path";
import Categorie, { ICategorie } from "@/models/stock/Categorie";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const router = Router();

/**
 * POST /api/dashboardadmin/stock/categories/create
 * — accepts optional “icon”, “image” and “banner” file uploads,
 *   stores them in Cloudinary (folder “categories”),
 *   and creates a new Categorie document.
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
      if (!name) {
        res.status(400).json({ success: false, message: "Category name is required." });
        return;
      }

      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      // prepare upload result holders
      let iconUrl: string | undefined, iconId: string | undefined;
      let imageUrl: string | undefined, imageId: string | undefined;
      let bannerUrl: string | undefined, bannerId: string | undefined;

      const files = req.files as Record<string, Express.Multer.File[]>;

      // ─── ICON (must be SVG) ────────────────────────────────
      if (files?.icon?.[0]) {
        const iconFile = files.icon[0];
        const ext = path.extname(iconFile.originalname).toLowerCase();

        if (ext !== ".svg" || iconFile.mimetype !== "image/svg+xml") {
          res
            .status(400)
            .json({ success: false, message: "Icon must be an SVG file." });
          return;
        }

        const { secureUrl, publicId } = await uploadToCloudinary(
          iconFile,
          "categories"
        );
        iconUrl = secureUrl;
        iconId = publicId;
      }

      // ─── IMAGE (any image type) ────────────────────────────
      if (files?.image?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(
          files.image[0],
          "categories"
        );
        imageUrl = secureUrl;
        imageId = publicId;
      }

      // ─── BANNER (any image type) ───────────────────────────
      if (files?.banner?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(
          files.banner[0],
          "categories"
        );
        bannerUrl = secureUrl;
        bannerId = publicId;
      }

      // ─── CREATE DOCUMENT ───────────────────────────────────
      const newCat = await Categorie.create({
        name,
        iconUrl,
        iconId,
        imageUrl,
        imageId,
        bannerUrl,
        bannerId,
        createdBy: userId,
      } as Partial<ICategorie>);

      res.status(201).json({
        success: true,
        message: "Category created successfully.",
        categorie: newCat,
      });
    } catch (err: any) {
      console.error("Create Category Error:", err);

      // Duplicate key
      if (err.code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "A category with that name already exists." });
        return;
      }

      // Mongoose validation
      if (err.name === "ValidationError" && err.errors) {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: messages.join(" ") });
        return;
      }

      // Fallback
      res.status(500).json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
