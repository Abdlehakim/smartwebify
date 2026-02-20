// src/routes/stock/productattribute/addNewProductAttribute.ts
import { Router, Request, Response } from "express";
import ProductAttribute, { AttributeType } from "@/models/stock/ProductAttribute";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

// Allowed types
const ALLOWED: AttributeType[] = ["dimension", "color", "other type"];

const isAllowedType = (x: unknown): x is AttributeType =>
  typeof x === "string" && ALLOWED.includes(x as AttributeType);

const isAllowedArray = (x: unknown): x is AttributeType[] =>
  Array.isArray(x) &&
  x.length > 0 &&
  (x as unknown[]).every((v) => isAllowedType(v));

/**
 * POST /api/dashboardadmin/stock/productattribute/create
 * — creates a new ProductAttribute with a name, type(s),
 *   and stamps createdBy from the authenticated user.
 *   Enforces case-insensitive uniqueness on `name`.
 */
router.post(
  "/create",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Extract & trim
      const name = ((req.body.name as string) || "").trim();
      const rawType = req.body.type as unknown;

      // Get user ID
      const userId = req.dashboardUser?._id;
      if (!userId) {
        res.status(401).json({ success: false, message: "Unauthorized." });
        return;
      }

      // Validate name presence
      if (!name) {
        res.status(400).json({ success: false, message: "Name is required." });
        return;
      }

      // Case-insensitive duplicate check
      const exists = await ProductAttribute.findOne({
        name: { $regex: `^${name}$`, $options: "i" }
      });
      if (exists) {
        res.status(400).json({
          success: false,
          message: "Attribute name already exists."
        });
        return;
      }

      // Validate type(s)
      let type: AttributeType | AttributeType[];
      if (isAllowedType(rawType)) {
        type = rawType;
      } else if (isAllowedArray(rawType)) {
        type = rawType;
      } else {
        res
          .status(400)
          .json({ success: false, message: "Invalid 'type' value." });
        return;
      }

      // Create the document
      const attribute = await ProductAttribute.create({
        name,
        type,
        createdBy: userId
      });

      res
        .status(201)
        .json({ success: true, message: "Attribute created.", attribute });
    } catch (err: any) {
      console.error("Create ProductAttribute Error:", err);

      // Mongoose duplicate‐key fallback
      if (err.code === 11000) {
        res.status(400).json({
          success: false,
          message: "Attribute name already exists."
        });
        return;
      }

      // Validation errors
      if (err.name === "ValidationError" && err.errors) {
        const msgs = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(" ") });
        return;
      }

      // Other errors
      res
        .status(500)
        .json({ success: false, message: err.message || "Server error." });
    }
  }
);

export default router;
