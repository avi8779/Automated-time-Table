import mysql from "mysql2/promise";

export const connectToDB = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    console.log("✅ MySQL connected successfully");
    return connection;

  } catch (error) {
    console.error("❌ MySQL connection failed:", error.message);
    process.exit(1); // app stop kar do agar DB connect na ho
  }
};
