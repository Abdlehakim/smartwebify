// src/pages/api/dashboardadmin/stock/magasins/create.ts
import { Router, Request, Response } from "express";
import Magasin from "@/models/stock/Magasin";
import { requirePermission } from "@/middleware/requireDashboardPermission";
import { memoryUpload } from "@/lib/multer";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";

const router = Router();

/**
 * POST /api/dashboardadmin/stock/magasins/create
 */
router.post(
  "/create",
  requirePermission("M_Stock"),
  memoryUpload.single("image"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // 1) Extract & trim inputs
      const name = ((req.body.name as string) || "").trim();
      const phoneNumber = ((req.body.phoneNumber as string) || "").trim();
      const address = ((req.body.address as string) || "").trim();
      const city = ((req.body.city as string) || "").trim();
      const localisation = ((req.body.localisation as string) || "").trim();
      const openingHoursRaw = req.body.openingHours as string;


      const userId = req.dashboardUser?._id;

      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized" });
        return;
      }

      // 4) Upload image if present
      let imageUrl: string | undefined;
      let imageId: string | undefined;
      if (req.file) {
        const uploaded = await uploadToCloudinary(req.file, "magasins");
        imageUrl = uploaded.secureUrl;
        imageId = uploaded.publicId;
      }

      // 5) Parse openingHours JSON
      let ohInput: unknown;
      try {
        ohInput = JSON.parse(openingHoursRaw);
      } catch {
        res
          .status(400)
          .json({
            success: false,
            message: "openingHours must be valid JSON.",
          });
        return;
      }

      const ohObj: Record<string, { open: string; close: string }[]> = {};
      if (Array.isArray(ohInput)) {
        (ohInput as any[]).forEach(({ day, open, close }) => {
          if (!ohObj[day]) ohObj[day] = [];
          ohObj[day].push({ open, close });
        });
      } else if (typeof ohInput === "object" && ohInput !== null) {
        Object.assign(ohObj, ohInput as object);
      }
      const openingHoursMap = new Map(Object.entries(ohObj));

      const magasin = await Magasin.create({
        name,
        phoneNumber,
        address,
        city,
        localisation,
        image: imageUrl,
        imageId,
        openingHours: openingHoursMap,
        createdBy: userId,
      });

      res
        .status(201)
        .json({ success: true, message: "Magasin created.", magasin });
    } catch (err: any) {
      console.error("Create Magasin Error:", err);

      // Duplicate key (name exists)
      if (err.code === 11000) {
        res
          .status(400)
          .json({ success: false, message: "Magasin name already exists." });
        return;
      }

      // Mongoose validation errors
      if (err.name === "ValidationError" && err.errors) {
        const messages = Object.values(err.errors).map((e: any) => e.message);
        const friendly = messages
          .map((m) =>
            m.replace(
              /Path `(\w+)` is required\./,
              (_match: string, field: string) =>
                `${field.charAt(0).toUpperCase() + field.slice(1)} is required.`
            )
          )
          .join(" ");
        res.status(400).json({ success: false, message: friendly });
        return;
      }

      // Fallback server error
      res
        .status(500)
        .json({ success: false, message: err.message || "Server error." });
    }
  }
);

export default router;
