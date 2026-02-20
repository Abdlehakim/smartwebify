// routes/dashboardadmin/users/createDashboardUser.ts

import { Router, Request, Response } from "express";
import DashboardUser from "@/models/dashboardadmin/DashboardUser";

const router = Router();
import { requirePermission } from "@/middleware/requireDashboardPermission";

/**
 * POST /api/dashboardadmin/users
 * Creates a new DashboardUser
 */
router.post("/create",
  requirePermission('M_Access'),
   async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, phone, email, password, role } = req.body;

    // Simple required-fields check
    if (!username || !phone || !email || !password || !role) {
      res.status(400).json({
        message:
          "Missing required fields: username, phone, email, password, role",
      });
      return;
    }

    // Create a new user instance
    const newUser = new DashboardUser({
      username,
      phone,
      email,
      password,
      role,
    });

    // Saving triggers the pre-save hook to hash the password
    await newUser.save();

    // Return a success response (no `return` statement needed)
    res.status(201).json({
      message: "DashboardUser created successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        phone: newUser.phone,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Create DashboardUser Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
