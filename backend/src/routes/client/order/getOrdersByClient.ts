import express, { Request, Response } from "express";
import { authenticateToken } from "@/middleware/authenticateToken";
import Order from "@/models/Order";

const router = express.Router();

router.get(
  "/getOrdersByClient",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized: User not found." });
        return;
      }

      const orders = await Order.find({ client: userId })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      res.status(200).json(orders);
    } catch (error) {
      console.error("Error retrieving orders:", error);
      res.status(500).json({
        error: "Server error. Unable to retrieve orders at this time.",
      });
    }
  }
);

export default router;
