// ───────────────────────────────────────────────────────────────
// src/routes/dashboardadmin/users/updateUserDashboard.ts
// Securely updates a DashboardUser: username • phone • email • password • role
// ───────────────────────────────────────────────────────────────
import { Router, Request, Response } from "express";
import DashboardUser from "@/models/dashboardadmin/DashboardUser";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = Router();

/* ------------------------------------------------------------------ */
/*  PUT /api/dashboardadmin/users/update/:userId                      */
/* ------------------------------------------------------------------ */
router.put(
  "/update/:userId",
  requirePermission("M_Access"),
  async (req: Request, res: Response): Promise<void> => {
    const { userId } = req.params;

    try {
      /* ---------- fetch target ---------- */
      const user = await DashboardUser.findById(userId);
      if (!user) {
        res.status(404).json({ message: "DashboardUser not found" });
        return;
      }

      /* ---------- build update payload ---------- */
      const allowed = ["username", "phone", "email", "password", "role"] as const;
      let hasChanges = false;

      for (const key of allowed) {
        const incoming = req.body[key];
        if (incoming === undefined) continue;           // field not sent
        const value = typeof incoming === "string" ? incoming.trim() : incoming;

        // Skip blanks; skip identical values
        if (value === "" || (user as any)[key] === value) continue;

        (user as any)[key] = value;                     // assign change
        hasChanges = true;
      }

      if (!hasChanges) {
        res.status(400).json({ message: "No valid fields provided for update" });
        return;
      }

      /* ----- save() triggers pre-save hooks (bcrypt on new password) ----- */
      await user.save();

      res.json({
        message: "DashboardUser updated successfully",
        user: {
          _id:       user._id,
          username:  user.username,
          phone:     user.phone,
          email:     user.email,
          role:      user.role,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("Update DashboardUser Error:", error);

      // Duplicate key (username/email/phone) → code 11000
      if (error.code === 11000) {
        const dupField = Object.keys(error.keyPattern)[0];
        res.status(400).json({ message: `Duplicate value for ${dupField}` });
        return;
      }

      // Aggregate Mongoose validation messages
      if (error.name === "ValidationError") {
        const msgs = Object.values(error.errors).map((e: any) => e.message);
        res.status(400).json({ message: msgs.join(" ") });
        return;
      }

      res.status(500).json({ message: "Internal server error" });
    }
  }
);

export default router;
