import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  addToCart,
  removeFromCart,
  getCart,
} from "../controllers/cartController.js";

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, addToCart);
cartRouter.post("/remove", authMiddleware, removeFromCart);

// ✅ Use GET for fetching cart
cartRouter.get("/get", authMiddleware, getCart);

export default cartRouter;
