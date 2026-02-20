import { Router, Request, Response } from "express";
import DashboardRole from "@/models/dashboardadmin/DashboardRole";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * GET /api/dashboardadmin/roles
 * Returns every role (id + name) except SuperAdmin—for dropdown use.
 * Access limited to users whose role includes permission "M_Access".
 */
router.get(
  "/",
  requirePermission("M_Access"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const roles = await DashboardRole.find({ name: { $ne: "SuperAdmin" } })
        .select("_id name permissions")
        .sort("name");

      res.json({ roles });
      return;
    } catch (err) {
      console.error("getAllRoles error:", err);
      res.status(500).json({ message: "Internal server error." });
      return;
    }
  }
);

export default router;
