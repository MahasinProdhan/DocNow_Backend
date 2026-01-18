import express from "express";
import cors from "cors";
import "dotenv/config";
// import connectDB from "./config/mongodb.js";
import { connectCloudinary } from "./config/cloudinary.js";
import connectDB from "./config/mongodb.js";
import adminRouter from "./routes/adminRoutes.js";
import doctorRouter from "./routes/doctorRoutes.js";
import userRouter from "./routes/userRoute.js";

//app configs
const app = express();
const port = process.env.PORT || 4000;
connectDB();
connectCloudinary();

//middlewares

app.use(express.json());
app.use(cors());

//api endpoint
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
//localhost:4000 / api/ admin/adddoctor

app.get("/", (req, res) => {
  res.send("API WORKING");
});

app.listen(port, () => console.log("server Started", port));
