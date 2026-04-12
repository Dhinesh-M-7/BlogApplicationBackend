import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

const PgStore = pgSession(session);

if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET is required for express-session.");
}

export const sessionHandler = session({
    store: new PgStore({
        pool,
        tableName: "usersession",
        pruneSessionInterval: 60 * 60,
        columns: {
            userid: {
                type: 'integer',
                get: (sess: any) => sess.user?.id
            }
        }
    } as any),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
        sameSite: 'none',
        secure: true
    }
});