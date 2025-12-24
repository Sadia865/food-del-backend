// orderController.js - FINAL VERSION
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Place order using Stripe
const placeOrder = async (req, res) => {
  try {
    const userId = req.user.id; // Get user from JWT
    const { items, amount, address } = req.body;

    console.log("📦 Placing order for user:", userId);

    if (!items || items.length === 0 || !amount || !address) {
      return res.status(400).json({
        success: false,
        message: "Invalid order data",
      });
    }

    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      payment: false,
      status: "Food Processing",
    });
    await newOrder.save();

    console.log("✅ Order created:", newOrder._id);

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Charges" },
        unit_amount: 2 * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`,
      metadata: {
        orderId: newOrder._id.toString(),
      },
    });

    newOrder.sessionId = session.id;
    await newOrder.save();

    res.status(200).json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// ✅ FIXED: Verify order after Stripe payment (NO AUTH CHECK)
const verifyOrder = async (req, res) => {
  try {
    const { orderId, success } = req.body;

    console.log("🔍 Verifying order:", orderId, "Success:", success);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const paymentStatus = success === "true" || success === true;

    if (paymentStatus) {
      order.payment = true;
      await order.save();

      console.log("✅ Payment verified for order:", orderId);

      return res.status(200).json({
        success: true,
        message: "Payment successful",
      });
    } else {
      await orderModel.findByIdAndDelete(orderId);

      console.log("❌ Payment cancelled for order:", orderId);

      return res.status(200).json({
        success: false,
        message: "Payment cancelled or failed",
      });
    }
  } catch (error) {
    console.error("❌ Error in verifyOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Verification failed",
    });
  }
};

// Get logged-in user's orders (requires auth)
const userOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel
      .find({ userId, payment: true })
      .sort({ date: -1 });

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Admin: List all orders (requires auth)
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ date: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error listing orders" });
  }
};

// Admin: Update order status (requires auth)
const updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ success: false, message: "Missing data" });
    }

    await orderModel.findByIdAndUpdate(orderId, { status });
    res.status(200).json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };
