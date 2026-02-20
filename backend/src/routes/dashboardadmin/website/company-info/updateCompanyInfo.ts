// routes/dashboardadmin/website/company-info/updateCompanyInfo.ts

import { Router, Request, Response } from "express";
import CompanyData, { ICompanyData } from "@/models/websitedata/companyData";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import cloudinary from "@/lib/cloudinary";

const router = Router();

/**
 * PUT /api/dashboardadmin/website/company-info/updateCompanyInfo/:id
 * — updates any of the CompanyData fields (including `vat`) and replaces
 *   “banner”, “logo”, or “contactBanner” on the single CompanyData doc
 */
router.put(
  "/updateCompanyInfo/:id",
  requirePermission("M_WebsiteData"),
  memoryUpload.fields([
    { name: "banner", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "contactBanner", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.dashboardUser?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      // 1) load existing
      const existing = await CompanyData.findById(id);
      if (!existing) {
        res.status(404).json({ success: false, message: "CompanyInfo not found." });
        return;
      }

      // 2) build updateData
      const updateData: Partial<ICompanyData> = {};
      const {
        name,
        description,
        email,
        phone,
        vat,            // ← Matricule fiscale
        address,
        city,
        zipcode,
        governorate,
        facebook,
        linkedin,
        instagram,
      } = req.body as Partial<Record<keyof ICompanyData, string>>;

      // validate & assign text fields
      if (name !== undefined) {
        if (!name.trim()) {
          res.status(400).json({ success: false, message: "Name cannot be empty." });
          return;
        }
        updateData.name = name.trim();
      }
      if (description !== undefined) {
        if (!description.trim()) {
          res.status(400).json({ success: false, message: "Description cannot be empty." });
          return;
        }
        updateData.description = description.trim();
      }
      if (email !== undefined) {
        if (!email.trim()) {
          res.status(400).json({ success: false, message: "Email cannot be empty." });
          return;
        }
        updateData.email = email.trim();
      }
      if (phone !== undefined) {
        if (!phone.trim()) {
          res.status(400).json({ success: false, message: "Phone cannot be empty." });
          return;
        }
        updateData.phone = phone.trim();
      }
      if (vat !== undefined) { // ← new
        if (!vat.trim()) {
          res.status(400).json({ success: false, message: "VAT (Matricule fiscale) cannot be empty." });
          return;
        }
        updateData.vat = vat.trim();
      }
      if (address !== undefined) {
        if (!address.trim()) {
          res.status(400).json({ success: false, message: "Address cannot be empty." });
          return;
        }
        updateData.address = address.trim();
      }
      if (city !== undefined) {
        if (!city.trim()) {
          res.status(400).json({ success: false, message: "City cannot be empty." });
          return;
        }
        updateData.city = city.trim();
      }
      if (zipcode !== undefined) {
        if (!zipcode.trim()) {
          res.status(400).json({ success: false, message: "Zipcode cannot be empty." });
          return;
        }
        updateData.zipcode = zipcode.trim();
      }
      if (governorate !== undefined) {
        if (!governorate.trim()) {
          res.status(400).json({ success: false, message: "Governorate cannot be empty." });
          return;
        }
        updateData.governorate = governorate.trim();
      }
      if (facebook !== undefined) {
        updateData.facebook = facebook.trim();
      }
      if (linkedin !== undefined) {
        updateData.linkedin = linkedin.trim();
      }
      if (instagram !== undefined) {
        updateData.instagram = instagram.trim();
      }

      // 3) handle file replacements
      const files = req.files as Record<string, Express.Multer.File[]>;

      if (files.banner?.[0]) {
        if (existing.bannerImageId) {
          try {
            await cloudinary.uploader.destroy(existing.bannerImageId);
          } catch (err) {
            console.error("Cloudinary banner deletion error:", err);
          }
        }
        const { secureUrl, publicId } = await uploadToCloudinary(files.banner[0], "company");
        updateData.bannerImageUrl = secureUrl;
        updateData.bannerImageId = publicId;
      }

      if (files.logo?.[0]) {
        if (existing.logoImageId) {
          try {
            await cloudinary.uploader.destroy(existing.logoImageId);
          } catch (err) {
            console.error("Cloudinary logo deletion error:", err);
          }
        }
        const { secureUrl, publicId } = await uploadToCloudinary(files.logo[0], "company");
        updateData.logoImageUrl = secureUrl;
        updateData.logoImageId = publicId;
      }

      if (files.contactBanner?.[0]) {
        if (existing.contactBannerId) {
          try {
            await cloudinary.uploader.destroy(existing.contactBannerId);
          } catch (err) {
            console.error("Cloudinary contactBanner deletion error:", err);
          }
        }
        const { secureUrl, publicId } = await uploadToCloudinary(files.contactBanner[0], "company");
        updateData.contactBannerUrl = secureUrl;
        updateData.contactBannerId = publicId;
      }

      // 4) apply update
      const updated = await CompanyData.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updated) {
        res.status(404).json({ success: false, message: "CompanyInfo not found after update." });
        return;
      }

      res.json({
        success: true,
        message: "Company info updated successfully.",
        companyInfo: updated,
      });
    } catch (err: unknown) {
      console.error("Update CompanyInfo Error:", err);
      if (err instanceof Error && (err as any).name === "ValidationError") {
        const msgs = Object.values((err as any).errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(" ") });
      } else {
        res.status(500).json({ success: false, message: "Internal server error." });
      }
    }
  }
);

export default router;
