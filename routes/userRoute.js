import express from "express";
import { loginUser, registerUser } from "../controllers/userController.js";

const userRouter = express.Router();

//end point to register the user
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);

export default userRouter;
