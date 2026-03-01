import { Router, Request, Response } from "express";
import userRouter from "./userRoutes.js";

const rootRouter = Router();

rootRouter.get("/session", (req: Request, res: Response) => {
    const user = (req.session as any)?.user;

    if (!user) {
        return res.status(401).json({ message: "Session expired", redirectTo: "/" });
    }

    const { id, ...sessionData } = user;
    return res.status(200).json(sessionData);
});

rootRouter.use("/users", userRouter);

export default rootRouter;