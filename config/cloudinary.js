// config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
// import { cloudinary } from "../config/cloudinary.js";

const connectCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log("✅ Cloudinary configured");
};

export { cloudinary, connectCloudinary };
