// routes/dashboardadmin/updateRolePermissions.ts
import { Router, Request, Response } from "express";
import DashboardRole from "@/models/dashboardadmin/DashboardRole";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * PUT /api/dashboardadmin/roles/updatePermission/:roleId
 * Only users with "M_Access" may call this.
 */
router.put(
  "/updatePermission/:roleId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions) || !permissions.every(p => typeof p === "string")) {
        res.status(400).json({ message: "Permissions must be an array of strings." });
        return;
      }

      const updatedRole = await DashboardRole.findByIdAndUpdate(
        roleId,
        { permissions },
        { new: true }
      ).select("_id name permissions");

      if (!updatedRole) {
        res.status(404).json({ message: "Role not found." });
        return;
      }

      res.json({ message: "Role permissions updated successfully.", role: updatedRole });
    } catch (err) {
      console.error("Update role permissions error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
