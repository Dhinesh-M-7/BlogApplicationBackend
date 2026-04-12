import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../config/db.js";

const RTOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export const refreshSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const { path, session, cookies } = req;

    const isPublicRoute = ["/api/users/login", "/api/users/forgotpassword", "/api/users/resetpassword", "/api/users/signup"].includes(path) || path.startsWith("/api/users/verifyemail");
    if (isPublicRoute || (session && (session as any).user)) {
        return next();
    }

    const { rToken } = cookies;

    const failSession = (message = "Session expired") => {
        res.clearCookie("rToken");
        return res.status(401).json({ success: false, message, redirectTo: "/" });
    };

    if (!rToken) return failSession();

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const tokenCheck = await client.query(
            `SELECT rt.*, u.name, u.email 
             FROM refreshtokens rt
             JOIN users u ON rt.userid = u.id
             WHERE rt.token = $1 FOR UPDATE`,
            [rToken]
        );

        if (tokenCheck.rowCount === 0) {
            await client.query('ROLLBACK');
            return failSession();
        }

        const storedToken = tokenCheck.rows[0];

        if (new Date() > new Date(storedToken.expire)) {
            await client.query(`DELETE FROM refreshtokens WHERE token = $1`, [rToken]);
            await client.query('COMMIT');
            return failSession();
        }

        const newRefreshToken = randomUUID();
        const newExpiry = new Date(Date.now() + RTOKEN_EXPIRY_MS);

        await client.query(`DELETE FROM refreshtokens WHERE token = $1`, [rToken]);
        await client.query(
            `INSERT INTO refreshtokens (token, userid, expire) VALUES ($1, $2, $3)`,
            [newRefreshToken, storedToken.userid, newExpiry]
        );

        await client.query('COMMIT');

        (session as any).user = { id: storedToken.userid, name: storedToken.name, email: storedToken.email };

        res.cookie('rToken', newRefreshToken, {
            httpOnly: true,
            maxAge: RTOKEN_EXPIRY_MS,
            sameSite: 'none',
            secure: true
        });

        session.save(async (err) => {
            if (err) return failSession("Internal session error");

            await pool.query(
                'UPDATE usersession SET userid = $1 WHERE sid = $2',
                [storedToken.userid, req.sessionID]
            );
            return next();
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Critical Refresh Error:", error);
        return failSession();
    } finally {
        client.release();
    }
};