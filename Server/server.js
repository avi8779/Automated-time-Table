import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { pool } from "./config/dbConn.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 🔹 DB connection test
    const [ping] = await pool.query("SELECT 1 AS db_status");
    console.log("✅ DB Connected:", ping);

    // 🔹 REAL DATA FETCH (example: departments)
    // const [departments] = await pool.query("SELECT * FROM department");
    // console.log("📦 Departments Data:");
    // console.table(departments);   // 👈 BEST for terminal

    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
};

startServer();
