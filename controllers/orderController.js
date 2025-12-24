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

    // Save order in DB (payment initially false)
    const newOrder = new orderModel({
      userId,
      items,
      amount,
      address,
      payment: false, // Will be updated after verification
      status: "Food Processing",
    });
    await newOrder.save();

    console.log("✅ Order created:", newOrder._id);

    // Clear user's cart
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Prepare Stripe line items
    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add delivery charges
    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Charges" },
        unit_amount: 2 * 100, // $2 delivery fee
      },
      quantity: 1,
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${process.env.FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${process.env.FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`,
      metadata: {
        orderId: newOrder._id.toString(),
      },
    });

    // Save session ID to order
    newOrder.sessionId = session.id;
    await newOrder.save();

    console.log("✅ Stripe session created:", session.id);
    console.log("✅ Redirect URL:", session.url);

    res.status(200).json({
      success: true,
      session_url: session.url,
    });
  } catch (error) {
    console.error("❌ Error in placeOrder:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Something went wrong",
    });
  }
};

// Verify order after Stripe payment
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

    // Find the order
    const order = await orderModel.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Verify the order belongs to the authenticated user
    if (order.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to order",
      });
    }

    const paymentStatus = success === "true" || success === true;

    if (paymentStatus) {
      // Payment successful - update order
      order.payment = true;
      await order.save();

      console.log("✅ Payment verified for order:", orderId);

      res.status(200).json({
        success: true,
        message: "Payment successful",
        order: {
          _id: order._id,
          amount: order.amount,
          items: order.items,
          address: order.address,
          status: order.status,
          payment: order.payment,
        },
      });
    } else {
      // Payment cancelled/failed - delete order
      await orderModel.findByIdAndDelete(orderId);

      console.log("❌ Payment cancelled for order:", orderId);

      res.status(200).json({
        success: false,
        message: "Payment cancelled or failed",
      });
    }
  } catch (error) {
    console.error("❌ Error in verifyOrder:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Verification failed",
    });
  }
};

// Get logged-in user's orders (requires auth)
const userOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await orderModel
      .find({ userId, payment: true })
      .sort({ date: -1 }); // Sort by date, newest first

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// Admin: List all orders (requires auth)
const listOrders = async (req, res) => {
  try {
    const orders = await orderModel.find().sort({ date: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.error("Error listing orders:", error);
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
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: "Error updating status" });
  }
};

export { placeOrder, verifyOrder, userOrders, listOrders, updateStatus };