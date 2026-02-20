// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/users/getUserById.ts
// Returns a single DashboardUser by _id (password omitted)
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import DashboardUser from "@/models/dashboardadmin/DashboardUser";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  GET /api/dashboardadmin/users/:userId                             */
/* ------------------------------------------------------------------ */
router.get(
  "/:userId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    try {
      const user = await DashboardUser.findById(userId)
        .select("-password")            // omit hashed password
        .populate("role", "name");     // include role name only

      if (!user) {
        res.status(404).json({ message: "DashboardUser not found" });
        return;
      }

      res.json({ user });
    } catch (error) {
      console.error("Get DashboardUser Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
