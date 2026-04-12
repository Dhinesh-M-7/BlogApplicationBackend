import dotenv from "dotenv";
import express, { Request, Response } from "express";
import cors from 'cors';
import cookieParser from "cookie-parser";

import { errorHandler } from "./middlewares/errorHandler.js";
import { sessionHandler } from "./middlewares/sessionHandler.js";
import { refreshSessionHandler } from "./middlewares/refreshSessionHandler.js";

import rootRouter from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [];

app.set('trust proxy', 1);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req: Request, res: Response) => {
    res.status(200).send("Application is running successfully!");
});

app.use(sessionHandler);
app.use(refreshSessionHandler);

app.use("/api", rootRouter);

app.use((_req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found",
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});