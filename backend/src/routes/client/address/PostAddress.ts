import express, { Request, Response } from "express";
import { authenticateToken } from "@/middleware/authenticateToken";
import Address from "@/models/Address"; // Adjust the path as needed

const router = express.Router();

// POST /api/client/address/postAddress
router.post(
  "/PostAddress",
  authenticateToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Destructure the required fields (including Phone) from the request body
      const {
        Name,
        StreetAddress,
        Country,
        Province,
        City,
        PostalCode,
        Phone,
      } = req.body;

      // Use the authenticated user's id as the client
      const clientId = (req as any).user.id;

      // Create a new address instance with Phone
      const newAddress = new Address({
        Name,
        StreetAddress,
        Country,
        Province,
        City,
        PostalCode,
        Phone,
        client: clientId,
      });

      // Save the address to the database
      const savedAddress = await newAddress.save();

      // Send the newly created address
      res.status(201).json(savedAddress);
    } catch (error) {
      console.error("Error creating address:", error);
      res.status(500).json({ error: "Server error while creating address" });
    }
  }
);

export default router;
