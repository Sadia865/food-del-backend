import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  placeOrder,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

// USER ROUTES
orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/verify", authMiddleware, verifyOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);

// ADMIN ROUTES
orderRouter.get("/list", authMiddleware, listOrders);
orderRouter.post("/status", authMiddleware, updateStatus);

export default orderRouter;