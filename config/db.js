import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://rahimsadia733_db_user:sdmsg315@cluster0.bkzhhfr.mongodb.net/food-del"
    )
    .then(() => console.log("DB Connected"))
    .catch((err) => console.log("DB Connection Error:", err));
};
