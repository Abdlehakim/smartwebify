// src/pages/api/dashboardadmin/stock/brands/create.ts

import { Router, Request, Response } from "express";
import { Types } from "mongoose";
import Brand, { IBrand } from "@/models/stock/Brand";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const router = Router();

/**
 * POST /api/dashboardadmin/stock/brands/create
 * — accepts optional “logo”, “image” and “description”
 *    stores files in Cloudinary under “brands”,
 *    and creates a new Brand document.
 */
router.post(
  "/create",
  requirePermission("M_Stock"),
  memoryUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // --- validate required fields ---
      const name = ((req.body.name as string) || "").trim();
      const place = ((req.body.place as string) || "").trim();
      const rawDesc = (req.body.description as string) ?? "";
      const description = rawDesc.trim();

      if (!name || !place) {
        res
          .status(400)
          .json({ success: false, message: "Both name and place are required." });
        return;
      }

      // --- get current user ---
      const userId = req.dashboardUser?._id as Types.ObjectId | undefined;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      // --- upload logo if present ---
      let logoUrl: string | undefined;
      let logoId: string | undefined;
      const logoFile = (req.files as any)?.logo?.[0];
      if (logoFile) {
        const uploadedLogo = await uploadToCloudinary(logoFile, "brands");
        logoUrl = uploadedLogo.secureUrl;
        logoId  = uploadedLogo.publicId;
      }

      // --- upload image if present ---
      let imageUrl: string | undefined;
      let imageId: string | undefined;
      const imageFile = (req.files as any)?.image?.[0];
      if (imageFile) {
        const uploadedImage = await uploadToCloudinary(imageFile, "brands");
        imageUrl = uploadedImage.secureUrl;
        imageId  = uploadedImage.publicId;
      }

      // --- build payload, only include description if non-empty ---
      const payload: Partial<IBrand> = {
        name,
        place,
        createdBy: userId,
      };
      if (description) {
        payload.description = description;
      }
      if (logoUrl && logoId) {
        payload.logoUrl = logoUrl;
        payload.logoId  = logoId;
      }
      if (imageUrl && imageId) {
        payload.imageUrl = imageUrl;
        payload.imageId  = imageId;
      }

      // --- create and respond ---
      const newBrand = await Brand.create(payload);
      res.status(201).json({
        success: true,
        message: "Brand created successfully.",
        brand: newBrand,
      });
    } catch (err: unknown) {
      console.error("Create Brand Error:", err);

      // duplicate key
      if ((err as any).code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "A brand with that name already exists." });
        return;
      }

      // validation errors
      if ((err as any).name === "ValidationError" && (err as any).errors) {
        const messages = Object.values((err as any).errors).map((e: any) => e.message);
        res
          .status(400)
          .json({ success: false, message: messages.join(" ") });
        return;
      }

      // fallback
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
