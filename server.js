import express from "express";
import cors from "cors";
import "dotenv/config";
// import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import connectDB from "./config/mongodb.js";

//app configs
const app = express();
const port = process.env.PORT || 4000;
connectDB;
connectCloudinary;

//middlewares

app.use(express.json());
app.use(cors());

//api endpoint

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => console.log("server Started", port));
