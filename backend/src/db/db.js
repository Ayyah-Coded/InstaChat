import mongoose from "mongoose";


export async function connectDB() {

  try {
    const db_uri = process.env.MONGODB_URI;

    if (!db_uri) {
      throw new Error("MONGODB_URI is required");
    };

    const conn = await mongoose.connect(db_uri);
    console.log("MongoDB connected", conn.connection.host);

  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  };
};