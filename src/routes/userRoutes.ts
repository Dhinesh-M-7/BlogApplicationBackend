import { Router } from "express";
import { getUser, signupUser, verifyUser, loginUser, logoutUser, changeUserPassword, forgotPassword, resetPassword } from "../controllers/userController.js";

export const userRouter = Router();

userRouter.post("/signup", signupUser);
userRouter.get("/verifyemail/:token", verifyUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.patch("/changepassword", changeUserPassword);
userRouter.post("/forgotpassword", forgotPassword);
userRouter.post("/resetpassword", resetPassword);
userRouter.get("/detail", getUser);

export default userRouter;