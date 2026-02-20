// backend/src/routes/dashboardadmin/orders/getOne.ts
import express from "express";
import Order from "@/models/Order";
import { requirePermission } from "@/middleware/requireDashboardPermission";

const router = express.Router();
router.get("/getOne/:id", requirePermission("M_Access"), async (req, res) => {
  const order = await Order.findById(req.params.id).select("Invoice orderStatus ref");
  if (!order) return res.status(404).json({ message: "Not found" });
  res.json({ order });
});
export default router;
