// routes/dashboardadmin/roles.delete.ts
import { Router, Request, Response } from "express";
import DashboardRole from "@/models/dashboardadmin/DashboardRole";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * DELETE /api/dashboardadmin/roles/delete/:roleId
 * Deletes a role by ID. Only users with "M_Access" may call this.
 */

router.delete(
  "/delete/:roleId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { roleId } = req.params;
      const deleted = await DashboardRole.findByIdAndDelete(roleId);
      if (!deleted) {
        res.status(404).json({ message: "Role not found." });
        return;
      }
      res.json({ message: "Role deleted successfully." });
    } catch (err) {
      console.error("Delete role error:", err);
      res.status(500).json({ message: "Internal server error." });
    }
  }
);

export default router;
