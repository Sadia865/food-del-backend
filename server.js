import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import cartRouter from "./routes/cartRoute.js";
import 'dotenv/config';
import orderRouter from "./routes/orderRoute.js";

const app = express();
const port = 4000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "https://food-del-admin-gamma-seven.vercel.app",  // removed trailing slash
    "https://food-del-frontend-eta-three.vercel.app"  // ADD THIS - your main frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "token"],
  credentials: true
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use("/uploads", express.static("uploads"));
app.use("/images", express.static('uploads'));

// DB connection
connectDB();

// API routes
app.use("/api/food", foodRouter);
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order",orderRouter);

// Test endpoint
app.get("/", (req, res) => {
  res.send("API Working");
});

// Start server
app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`);
});