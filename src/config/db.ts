import dotenv from 'dotenv';
dotenv.config();

import { Pool } from 'pg';

export const pool = new Pool({
    connectionString: process.env.DATABASE_CONNECTION_STRING,
});

pool.on("connect", () => {
    console.log("Connected to DB successfully");
})