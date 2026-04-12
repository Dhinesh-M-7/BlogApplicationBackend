import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
    statusCode?: number;
    errors?: any;
}

export const errorHandler = (
    err: ApiError,
    req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error(`[Error] ${req.method} ${req.path}:`, err);

    const statusCode = err.statusCode || 500;

    const response = {
        success: false,
        message: err.message || "Internal Server Error",
    };

    res.status(statusCode).json(response);
};