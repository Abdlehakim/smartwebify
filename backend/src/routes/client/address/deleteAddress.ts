import express, { Request, Response } from "express";
import Address from "@/models/Address";
import { authenticateToken } from "@/middleware/authenticateToken";

const router = express.Router();

// DELETE /api/client/address/deleteAddress/:id - Delete an address
router.delete(
  "/deleteAddress/:id",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      // Find the address belonging to the authenticated user using the 'client' field
      const address = await Address.findOne({ _id: id, client: userId });
      if (!address) {
        res.status(404).json({ error: "Address not found" });
        return;
      }
      await address.deleteOne(); // Use deleteOne instead of remove
      res.status(200).json({ message: "Address deleted successfully" });
    } catch (error) {
      console.error("Error deleting address:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;
