import { Router, Request, Response } from "express";
import mongoose from "mongoose";
import DashboardUser from "@/models/dashboardadmin/DashboardUser";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/**
 * DELETE /api/dashboardadmin/users/:userId
 * Removes a dashboard user (SuperAdmin users are protected).
 */
router.delete("/:userId", 
  requirePermission('M_Access'),
  async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!mongoose.isValidObjectId(userId)) {
    res.status(400).json({ message: "Invalid userId." });
    return;
  }

  try {
    // Load user with role populated so we can check for SuperAdmin
    const user = await DashboardUser.findById(userId).populate("role");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    // Don’t allow deleting a SuperAdmin account
    if ((user.role as any)?.name === "SuperAdmin") {
      res
        .status(403)
        .json({ message: "SuperAdmin user cannot be deleted." });
      return;
    }

    await user.deleteOne();
    res.json({ message: "User deleted." });
  } catch (err) {
    console.error("deleteUser error:", err);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
