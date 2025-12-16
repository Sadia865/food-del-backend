import foodModel from "../models/foodModel.js";
import fs from "fs";

// Add food item
const addFood = async (req, res) => {
  try {
    console.log("Add Food Request Body:", req.body);
    console.log("Add Food Request File:", req.file);

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    if (!req.body.name || !req.body.description || !req.body.price || !req.body.category) {
      return res.status(400).json({ 
        success: false, 
        message: "All fields are required" 
      });
    }

    const price = Number(req.body.price);
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Price must be a valid positive number" 
      });
    }

    const food = new foodModel({
      name: req.body.name,
      description: req.body.description,
      price: price,
      category: req.body.category,
      image: req.file.filename
    });

    await food.save();
    console.log("Food saved successfully:", food);
    res.json({ success: true, message: "Food Added", data: food });
  } catch (error) {
    console.log("Add Food Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// All Food List
const listFood = async (req, res) => {
  try {
    const foods = await foodModel.find({});
    console.log("Foods fetched:", foods.length);
    res.json({ success: true, data: foods });
  } catch (error) {
    console.log("List Food Error:", error);
    res.status(500).json({ success: false, message: "Error fetching foods" });
  }
};

// Remove Food Item - WITH MAXIMUM DEBUGGING
const removeFood = async (req, res) => {
  console.log("\n\n========================================");
  console.log("🔴 DELETE REQUEST RECEIVED");
  console.log("========================================");
  console.log("Full Request Body:", JSON.stringify(req.body, null, 2));
  console.log("Request Headers:", req.headers);
  console.log("========================================\n");

  try {
    const foodId = req.body.id;
    
    console.log("Step 1: Checking if ID exists...");
    console.log("Food ID received:", foodId);
    console.log("Type of ID:", typeof foodId);
    
    if (!foodId) {
      console.log("❌ ERROR: No ID provided");
      return res.status(400).json({ 
        success: false, 
        message: "Food ID is required" 
      });
    }

    console.log("Step 2: Searching for food in database...");
    const food = await foodModel.findById(foodId);
    
    console.log("Step 3: Food search result:", food);
    
    if (!food) {
      console.log("❌ ERROR: Food not found in database");
      return res.status(404).json({ 
        success: false, 
        message: "Food item not found in database" 
      });
    }

    console.log("✅ Food found:", {
      id: food._id,
      name: food.name,
      image: food.image
    });

    console.log("Step 4: Attempting to delete image file...");
    const imagePath = `uploads/${food.image}`;
    console.log("Image path:", imagePath);
    
    // Check if file exists before deleting
    if (fs.existsSync(imagePath)) {
      console.log("✅ Image file exists, deleting...");
      fs.unlinkSync(imagePath);
      console.log("✅ Image deleted successfully");
    } else {
      console.log("⚠️ Warning: Image file not found at path:", imagePath);
    }

    console.log("Step 5: Deleting food from database...");
    const deleteResult = await foodModel.findByIdAndDelete(foodId);
    console.log("Delete result:", deleteResult);
    
    console.log("✅✅✅ SUCCESS: Food removed completely");
    console.log("========================================\n\n");
    
    return res.json({ 
      success: true, 
      message: "Food item removed successfully" 
    });
    
  } catch (error) {
    console.log("\n========================================");
    console.log("❌❌❌ CRITICAL ERROR IN REMOVE FOOD");
    console.log("========================================");
    console.log("Error Type:", error.name);
    console.log("Error Message:", error.message);
    console.log("Error Stack:", error.stack);
    console.log("========================================\n\n");
    
    return res.status(500).json({ 
      success: false, 
      message: `Error: ${error.message}` 
    });
  }
};

export { addFood, listFood, removeFood };