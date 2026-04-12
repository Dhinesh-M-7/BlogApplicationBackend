import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables.");
}

interface UserPayload extends JwtPayload {
    email: string;
}

export const generateToken = (email: string): string => {
    return jwt.sign({ email }, JWT_SECRET, {
        expiresIn: "1h",
        algorithm: "HS256"
    });
};

export const decodeToken = (token: string): UserPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as UserPayload;
        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            console.warn("JWT expired");
        } else {
            console.error("JWT verification failed", error);
        }
        return null;
    }
};