// src/routes/dashboardadmin/stock/productattribute/updateProductAttribute.ts
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
 * PUT /api/dashboardadmin/stock/productattribute/update/:attributeId
 * — updates a ProductAttribute's name and/or type(s),
 *    enforces case-insensitive uniqueness on name,
 *    and stamps updatedBy from the authenticated user.
 */
router.put(
  "/update/:attributeId",
  requirePermission("M_Stock"),
  async (req: Request, res: Response): Promise<void> => {
    const { attributeId } = req.params;
    const userId = req.dashboardUser?._id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    try {
      // Load existing
      const existing = await ProductAttribute.findById(attributeId);
      if (!existing) {
        res
          .status(404)
          .json({ success: false, message: "Product attribute not found." });
        return;
      }

      const { name: rawName, type: rawType } = req.body as {
        name?: string;
        type?: unknown;
      };

      // Case-insensitive duplicate check if changing name
      if (typeof rawName === "string") {
        const trimmed = rawName.trim();
        if (!trimmed) {
          res
            .status(400)
            .json({ success: false, message: "Name cannot be empty." });
          return;
        }
        const conflict = await ProductAttribute.findOne({
          _id: { $ne: attributeId },
          name: { $regex: `^${trimmed}$`, $options: "i" },
        });
        if (conflict) {
          res
            .status(400)
            .json({ success: false, message: "Attribute name already exists." });
          return;
        }
      }

      // Build update data
      const updateData: Partial<{
        name: string;
        type: AttributeType | AttributeType[];
        updatedBy: typeof userId;
      }> = { updatedBy: userId };

      // Apply name change
      if (typeof rawName === "string") {
        updateData.name = rawName.trim();
      }

      // Apply type change
      if (rawType !== undefined) {
        if (isAllowedType(rawType)) {
          updateData.type = rawType;
        } else if (isAllowedArray(rawType)) {
          updateData.type = rawType;
        } else {
          res
            .status(400)
            .json({ success: false, message: "Invalid 'type' value." });
          return;
        }
      }

      // Execute update
      const updated = await ProductAttribute.findByIdAndUpdate(
        attributeId,
        updateData,
        { new: true, runValidators: true }
      )
        .populate("createdBy updatedBy", "username")
        .lean();

      if (!updated) {
        res
          .status(404)
          .json({ success: false, message: "Product attribute not found after update." });
        return;
      }

      res.json({
        success: true,
        message: "Product attribute updated successfully.",
        attribute: updated,
      });
    } catch (err: any) {
      console.error("Update ProductAttribute Error:", err);

      // Duplicate key fallback
      if (err.code === 11000) {
        res
          .status(400)
          .json({
            success: false,
            message: "Another attribute with that name already exists.",
          });
        return;
      }

      // Validation errors
      if (err.name === "ValidationError" && err.errors) {
        const msgs = Object.values(err.errors).map((e: any) => e.message);
        res.status(400).json({ success: false, message: msgs.join(" ") });
        return;
      }

      // General error
      res
        .status(500)
        .json({ success: false, message: "Internal server error." });
    }
  }
);

export default router;
