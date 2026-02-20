import express, { Request, Response } from "express";
import Address from "@/models/Address";
import { authenticateToken } from "@/middleware/authenticateToken";

const router = express.Router();

// GET /api/client/address/getAddress
router.get(
  "/getAddress",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized: User not found." });
        return;
      }
      const addresses = await Address.find({ client: userId })
        .sort({ createdAt: -1 })
        .exec();
      res.status(200).json(addresses);
    } catch (error) {
      console.error("Error fetching addresses:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

export default router;
