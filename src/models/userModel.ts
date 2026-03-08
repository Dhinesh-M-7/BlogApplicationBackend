import { randomUUID } from "node:crypto";
import { pool } from "../config/db.js";

export interface User {
    name: string;
    email: string;
    password: string;
}

export interface UserData {
    name: string;
    email: string;
    isvalidated: boolean;
}

export interface UserDetail {
    id: number;
    name: string;
    email: string;
    password: string;
    isvalidated: boolean;
    bio: string;
    profileurl: string;
}

interface UpdateUserData {
    name: string;
    bio: string;
    profileurl: string;
}

export const createUser = async (userData: User) => {
    const { name, email, password } = userData;
    const result = await pool.query(`INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING name, email, isvalidated`, [name, email, password]);
    return result.rows[0];
};

export const verifyUser = async (email: string) => {
    const result = await pool.query(`UPDATE users SET isvalidated = TRUE WHERE email = $1 RETURNING name, email`, [email]);
    return result.rows[0];
};

export const createRefreshToken = async (userId: number) => {
    const newRefreshToken = randomUUID();
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await pool.query(
        `INSERT INTO refreshtokens (token, userid, expire) VALUES ($1, $2, $3) RETURNING token`,
        [newRefreshToken, userId, newExpiry]
    );
    return result.rows[0];
}

export const getUserUsingEmail = async (email: string) => {
    const result = await pool.query(`SELECT id, name, email, password, isvalidated, bio, profileurl FROM users WHERE email = $1`, [email]);
    return result.rows[0] as UserDetail;
}

export const getUserUsingId = async (userId: number) => {
    const result = await pool.query(`SELECT id, name, email, password, isvalidated, bio, profileurl FROM users WHERE id = $1`, [userId]);
    return result.rows[0] as UserDetail;
}

export const updateUser = async (userId: number, updateUserData: UpdateUserData) => {
    const result = await pool.query(`UPDATE users SET name = $1, bio = $2, profileurl = $3 WHERE id = $4 RETURNING name, bio, profileurl, email`,
        [updateUserData.name, updateUserData.bio, updateUserData.profileurl, userId]);
    return result.rows[0];
}

export const updateUserIdToSession = async (id: number, sessionId: string) => {
    await pool.query(
        'UPDATE usersession SET userid = $1 WHERE sid = $2',
        [id, sessionId]
    );
}

export const clearRefreshToken = async (token: string) => {
    await pool.query(
        `DELETE FROM refreshtokens WHERE token = $1`,
        [token]
    )
}

export const updatePassword = async (password: string, userId: number) => {
    await pool.query(
        `UPDATE users SET password = $1 WHERE id = $2`,
        [password, userId]
    )
}

export const deleteOtherSessions = async (userId: number, sessionId: string, refreshToken: string) => {
    await pool.query(
        `DELETE FROM usersession WHERE userid = $1 AND sid != $2`,
        [userId, sessionId]
    )
    await pool.query(
        `DELETE FROM refreshtokens WHERE userid = $1 AND token != $2`,
        [userId, refreshToken]
    )
}

export const deleteAllSessions = async (userId: number) => {
    await pool.query(
        `DELETE FROM usersession WHERE userid = $1`, [userId]
    )
    await pool.query(
        `DELETE FROM refreshtokens WHERE userid = $1`, [userId]
    )
}