import userModel from "../models/userModel.js";

// ✅ Add item to cart
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartData = userData.cartData || {};

    cartData[itemId] = (cartData[itemId] || 0) + 1;

    userData.cartData = cartData;
    await userData.save();

    res.status(200).json({
      success: true,
      message: "Item added to cart",
      cartData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error adding to cart",
    });
  }
};

// ✅ Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const cartData = userData.cartData || {};

    if (cartData[itemId] > 1) {
      cartData[itemId] -= 1;
    } else {
      delete cartData[itemId];
    }

    userData.cartData = cartData;
    await userData.save();

    res.status(200).json({
      success: true,
      message: "Item removed from cart",
      cartData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error removing from cart",
    });
  }
};

// ✅ Get user cart (GET request safe)
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      cartData: userData.cartData || {},
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error fetching cart",
    });
  }
};

export { addToCart, removeFromCart, getCart };
