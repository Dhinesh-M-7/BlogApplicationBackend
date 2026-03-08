import { Router } from "express";
import { getUser, signupUser, verifyUser, loginUser, logoutUser, changeUserPassword, forgotPassword, resetPassword, updateProfile } from "../controllers/userController.js";
import multer from 'multer';

const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

export const userRouter = Router();

userRouter.post("/signup", signupUser);
userRouter.get("/verifyemail/:token", verifyUser);
userRouter.post("/login", loginUser);
userRouter.post("/logout", logoutUser);
userRouter.patch("/changepassword", changeUserPassword);
userRouter.post("/forgotpassword", forgotPassword);
userRouter.post("/resetpassword", resetPassword);
userRouter.get("/detail", getUser);
userRouter.patch("/profile", upload.single('image'), updateProfile);

export default userRouter;