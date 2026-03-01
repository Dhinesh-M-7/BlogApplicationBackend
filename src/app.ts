import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/errorHandler.js";
import { sessionHandler } from "./middlewares/sessionHandler.js";
import { refreshSessionHandler } from "./middlewares/refreshSessionHandler.js";
import rootRouter from "./routes/index.js";

const app = express();
const port = process.env.PORT || 5000;

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.use(cors({
    origin: (origin, callback) => {
        if (origin && allowedOrigins?.includes(origin)) callback(null, origin);
        else callback(new Error("Blocked by CORS"));
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(sessionHandler);
app.use(refreshSessionHandler);

app.use("/api", rootRouter);

app.get("/", (req: Request, res: Response) => {
    res.send("Application is running successfully!");
});

app.use((req: Request, res: Response) => {
    res.status(404).json({
        message: "Route Not Found",
    });
});

app.use(errorHandler);

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});