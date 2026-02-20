// routes/dashboardadmin/website/company-info/createCompanyInfo.ts

import { Router, Request, Response } from "express";
import CompanyData, { ICompanyData } from "@/models/websitedata/companyData";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const router = Router();

/**
 * POST /api/dashboardadmin/website/company-info/createCompanyInfo
 * — accepts “name”, “description”, “email”, “phone”, “vat”, “address”, “city”,
 *   “zipcode”, “governorate”, optional “facebook”, “linkedin”, “instagram”,
 *   optional “banner”, “logo”, “contactBanner” uploads,
 *   stores images in Cloudinary (folder “company”),
 *   and creates the single CompanyData document.
 *   Rejects if one already exists.
 */
router.post(
  "/createCompanyInfo",
  requirePermission("M_WebsiteData"),
  memoryUpload.fields([
    { name: "banner", maxCount: 1 },
    { name: "logo", maxCount: 1 },
    { name: "contactBanner", maxCount: 1 },
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Prevent more than one
      const count = await CompanyData.estimatedDocumentCount();
      if (count > 0) {
        res.status(400).json({
          success: false,
          message: "Company info already exists. Update the existing entry.",
        });
        return;
      }

      // Validate required fields
      const {
        name = "",
        description = "",
        email = "",
        phone = "",
        vat = "", // ← Matricule fiscale
        address = "",
        city = "",
        zipcode = "",
        governorate = "",
        facebook,
        linkedin,
        instagram,
      } = req.body as {
        name?: string;
        description?: string;
        email?: string;
        phone?: string;
        vat?: string;        // ← Matricule fiscale
        address?: string;
        city?: string;
        zipcode?: string;
        governorate?: string;
        facebook?: string;
        linkedin?: string;
        instagram?: string;
      };

      if (!name.trim()) {
        res.status(400).json({ success: false, message: "Name is required." });
        return;
      }
      if (!description.trim()) {
        res.status(400).json({ success: false, message: "Description is required." });
        return;
      }
      if (!email.trim()) {
        res.status(400).json({ success: false, message: "Email is required." });
        return;
      }
      if (!phone.trim()) {
        res.status(400).json({ success: false, message: "Valid phone number is required." });
        return;
      }
      if (!vat.trim()) {
        res.status(400).json({ success: false, message: "VAT (Matricule fiscale) is required." });
        return;
      }
      if (!address.trim()) {
        res.status(400).json({ success: false, message: "Address is required." });
        return;
      }
      if (!city.trim()) {
        res.status(400).json({ success: false, message: "City is required." });
        return;
      }
      if (!zipcode.trim()) {
        res.status(400).json({ success: false, message: "Zipcode is required." });
        return;
      }
      if (!governorate.trim()) {
        res.status(400).json({ success: false, message: "Governorate is required." });
        return;
      }

      // Handle uploads
      const files = req.files as Record<string, Express.Multer.File[]>;
      let bannerImageUrl: string | undefined,
        bannerImageId: string | undefined,
        logoImageUrl: string | undefined,
        logoImageId: string | undefined,
        contactBannerUrl: string | undefined,
        contactBannerId: string | undefined;

      if (files.banner?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(files.banner[0], "company");
        bannerImageUrl = secureUrl;
        bannerImageId = publicId;
      }
      if (files.logo?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(files.logo[0], "company");
        logoImageUrl = secureUrl;
        logoImageId = publicId;
      }
      if (files.contactBanner?.[0]) {
        const { secureUrl, publicId } = await uploadToCloudinary(files.contactBanner[0], "company");
        contactBannerUrl = secureUrl;
        contactBannerId = publicId;
      }

      // Create the document
      const created = await CompanyData.create({
        name: name.trim(),
        bannerImageUrl,
        bannerImageId,
        logoImageUrl,
        logoImageId,
        contactBannerUrl,
        contactBannerId,
        description: description.trim(),
        email: email.trim(),
        phone: phone.trim(),
        vat: vat.trim(), // ← save VAT
        address: address.trim(),
        city: city.trim(),
        zipcode: zipcode.trim(),
        governorate: governorate.trim(),
        facebook: facebook?.trim(),
        linkedin: linkedin?.trim(),
        instagram: instagram?.trim(),
      } as Partial<ICompanyData>);

      res
        .status(201)
        .json({ success: true, message: "Company info created.", companyInfo: created });
    } catch (err: unknown) {
      console.error("Create CompanyInfo Error:", err);
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
