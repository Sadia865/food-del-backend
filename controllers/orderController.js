import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const placeOrder = async (req, res) => {
    const frontend_url = "http://localhost:5174";
    try {
        const { userId, items, amount, address } = req.body;

        if (!userId || !items || items.length === 0 || !amount) {
            return res.status(400).json({ success: false, message: "Invalid order data" });
        }

        // Save order
        const newOrder = new orderModel({ userId, items, amount, address });
        await newOrder.save();

        // Clear user's cart
        await userModel.findByIdAndUpdate(userId, { cartData: {} });

        // Prepare Stripe line items
        const line_items = items.map(item => ({
            price_data: {
                currency: "usd",
                product_data: { name: item.name },
                unit_amount: Math.round(item.price * 100) // Stripe requires integer
            },
            quantity: item.quantity
        }));

        // Add delivery charges
        line_items.push({
            price_data: {
                currency: "usd",
                product_data: { name: "Delivery Charges" },
                unit_amount: 2 * 100
            },
            quantity: 1
        });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            line_items,
            mode: "payment",
            success_url: `${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${frontend_url}/verify?success=false&orderId=${newOrder._id}`
        });

        console.log("Stripe session created:", session.url);

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.error("Error in placeOrder:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};

const verifyOrder = async (req, res) => {
    const { orderId, success } = req.body;

    try {
        if (!orderId || !success) {
            return res.status(400).json({ success: false, message: "Missing orderId or success flag" });
        }

        if (success === "true") {
            // Mark the order as paid in DB
            await orderModel.findByIdAndUpdate(orderId, { payment: true });

            return res.json({ success: true, message: "Payment successful", orderId });
        } else {
            // Payment failed or canceled
            await orderModel.findByIdAndUpdate(orderId, { payment: false });

            return res.json({ success: false, message: "Payment failed or canceled", orderId });
        }

    } catch (error) {
        console.error("Error in verifyOrder:", error);
        res.status(500).json({ success: false, message: "Something went wrong" });
    }
};
// User Orders for frontend (My Orders)
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel
            .find({ userId: req.body.userId, payment: true })
            .sort({ date: -1 }); // latest first

        res.json({ success: true, data: orders });
    } catch (error) {
        console.error("Error fetching user orders:", error);
        res.status(500).json({ success: false, message: "Failed to fetch orders" });
    }
};

// Listing Orders for Admin Panel
const listOrders=async(req,res)=>{
    try {
        const orders=await orderModel.find({});
        res.json({success:true,data:orders})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
        
    }

}
// Updating the status of order
const updateStatus=async (req,res)=>{
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
        res.json({success:true,message:"Status Updated"})
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"}) 
        
    }

}

export { placeOrder,verifyOrder,userOrders,listOrders,updateStatus };
