import dotenv from "dotenv";
dotenv.config();

import jwt from "jsonwebtoken";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
    throw new Error("JWT_SECRET is not defined in .env file");
}

export const generateToken = (email: string) => {
    return jwt.sign({ email }, jwtSecret, { expiresIn: "1h" });
};

export const decodeToken = (token: string) => {
    try {
        return jwt.verify(token, jwtSecret);
    } catch {
        return null;
    }
};
