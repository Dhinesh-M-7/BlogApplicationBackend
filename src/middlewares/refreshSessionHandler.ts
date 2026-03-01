import { Request, Response, NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { pool } from "../config/db.js";

interface StoredToken {
    token: string;
    userid: number;
    expire: string;
}

export const refreshSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
    const publicRoutes = ["/api/users/login", "/api/users/forgotpassword", "/api/users/resetpassword"];
    if (publicRoutes.includes(req.path)) return next();
    if (req.session && (req.session as any).user) return next();

    const { rToken } = req.cookies;
    if (!rToken) {
        return res.status(401).json({ message: "Session expired", redirectTo: "/" });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const result = await client.query(
            `SELECT * FROM refreshtokens WHERE token = $1 FOR UPDATE`,
            [rToken]
        );

        if (result.rowCount === 0) {
            await client.query('ROLLBACK');
            res.clearCookie("rToken");
            return res.status(401).json({ message: "Session expired", redirectTo: "/" });
        }

        const storedToken: StoredToken = result.rows[0];
        if (new Date() > new Date(storedToken.expire)) {
            await client.query(`DELETE FROM refreshtokens WHERE token = $1`, [rToken]);
            await client.query('COMMIT');
            res.clearCookie("rToken");
            return res.status(401).json({ message: "Session expired", redirectTo: "/" });
        }

        const newRefreshToken = randomUUID();
        const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await client.query(`DELETE FROM refreshtokens WHERE token = $1`, [rToken]);
        await client.query(
            `INSERT INTO refreshtokens (token, userid, expire) VALUES ($1, $2, $3)`,
            [newRefreshToken, storedToken.userid, newExpiry]
        );

        const userData = await client.query(`SELECT id, name, email FROM users WHERE id = $1`, [storedToken.userid]);
        const user = userData.rows[0];

        if (!user) {
            await client.query('ROLLBACK');
            res.clearCookie("rToken");
            return res.status(401).json({ message: "Session expired", redirectTo: "/" });
        }

        await client.query('COMMIT');

        (req.session as any).user = { id: user.id, name: user.name, email: user.email };

        res.cookie('rToken', newRefreshToken, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        req.session.save(async (err) => {
            if (err) {
                console.error(err);
                return res.status(401).json({ message: "Session expired", redirectTo: "/" });
            }
            await pool.query(
                'UPDATE usersession SET userid = $1 WHERE sid = $2',
                [user.id, req.sessionID]
            );
            return next();
        });

    } catch (error) {
        if (client) await client.query('ROLLBACK');
        console.error("Critical Refresh Error:", error);
        res.clearCookie("rToken");
        return res.status(401).json({ message: "Session expired", redirectTo: "/" });
    } finally {
        client.release();
    }
};