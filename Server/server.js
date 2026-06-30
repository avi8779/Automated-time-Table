import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import { pool } from "./config/dbConn.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // DB connection test
    const [ping] = await pool.query("SELECT 1 AS db_status");
    console.log("✅ DB Connected:", ping);

    

    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("❌ Database error:", error.message);
    process.exit(1);
  }
};

startServer();
