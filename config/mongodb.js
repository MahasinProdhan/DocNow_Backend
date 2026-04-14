import dns from "node:dns";
import mongoose from "mongoose";

const connectDB = async () => {
  // Some local Windows DNS setups fail SRV lookups used by MongoDB Atlas.
  // Point Node at stable public resolvers before opening the Atlas connection.
  dns.setServers(["8.8.8.8", "1.1.1.1"]);

  mongoose.connection.on("connected", () => console.log("Database Connected"));

  try {
    await mongoose.connect(process.env.MONGODB_URI);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
