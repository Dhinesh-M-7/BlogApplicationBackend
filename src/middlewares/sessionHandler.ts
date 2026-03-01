import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "../config/db.js";
import dotenv from "dotenv";
import { CipherKey } from "node:crypto";
dotenv.config();

pool.on("connect", () => {
    console.log("Connected to DB successfully");
})

const PgStore = pgSession(session);

export const sessionHandler = session({
    store: new PgStore({
        pool: pool,
        tableName: "usersession",
        pruneSessionInterval: 60 * 60,
        columns: {
            userid: {
                type: 'integer',
                get: (sess: any) => sess.user?.id
            }
        }
    } as any),
    secret: process.env.SESSION_SECRET as CipherKey,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
    }
});