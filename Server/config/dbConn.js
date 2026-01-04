import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const connectDB = async () => {
  try {
    const conn = await pool.getConnection();
    console.log("✅ MySQL database connected successfully");
    conn.release();
  } catch (error) {
    console.log("HOST:", process.env.DB_HOST);
    console.log("USER:", process.env.DB_USER);
    console.log("PASS:", process.env.DB_PASSWORD ? "LOADED" : "MISSING");
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
};
