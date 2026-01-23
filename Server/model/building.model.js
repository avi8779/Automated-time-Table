import { pool } from "../config/dbConn.js";

export const buildingCodeExists = async (building_code) => {
  const [rows] = await pool.query(
    "SELECT building_id FROM buildings WHERE building_code = ? AND is_deleted = 0",
    [building_code]
  );
  return rows.length > 0;
};

export const createBuilding = async (data) => {
  const { building_code, name } = data;

  const [result] = await pool.query(
    "INSERT INTO buildings (building_code, name) VALUES (?, ?)",
    [building_code, name]
  );

  return result.insertId;
};

export const getAllBuildings = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM buildings WHERE is_deleted = 0"
  );
  return rows;
};
