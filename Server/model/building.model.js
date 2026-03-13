import { pool } from "../config/dbConn.js";

// ── Helpers ──────────────────────────────────────────────────────────────────

export const buildingCodeExists = async (building_code) => {
  const [rows] = await pool.query(
    "SELECT building_id FROM buildings WHERE building_code = ? AND is_deleted = 0",
    [building_code]
  );
  return rows.length > 0;
};

export const buildingExistsById = async (building_id) => {
  const [rows] = await pool.query(
    "SELECT building_id FROM buildings WHERE building_id = ? AND is_deleted = 0",
    [building_id]
  );
  return rows.length > 0;
};

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createBuilding = async (data) => {
  const { building_code, building_name, floors, status } = data;

  const [result] = await pool.query(
    `INSERT INTO buildings (building_code, building_name, floors, status)
     VALUES (?, ?, ?, ?)`,
    [building_code, building_name, floors, status]
  );

  return result.insertId;
};

// ── READ ──────────────────────────────────────────────────────────────────────

export const getAllBuildings = async () => {
  const [rows] = await pool.query(
    `SELECT building_id, building_code, building_name, floors, status, created_at
     FROM buildings
     WHERE is_deleted = 0
     ORDER BY building_id ASC`
  );
  return rows;
};

export const getBuildingById = async (building_id) => {
  const [rows] = await pool.query(
    `SELECT building_id, building_code, building_name, floors, status
     FROM buildings
     WHERE building_id = ? AND is_deleted = 0`,
    [building_id]
  );
  return rows[0];
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateBuilding = async (building_id, data) => {
  const { building_code, building_name, floors, status } = data;

  const [result] = await pool.query(
    `UPDATE buildings
     SET building_code = ?, building_name = ?, floors = ?, status = ?
     WHERE building_id = ? AND is_deleted = 0`,
    [building_code, building_name, floors, status, building_id]
  );

  return result.affectedRows;
};

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

export const softDeleteBuilding = async (building_id) => {
  const [result] = await pool.query(
    `UPDATE buildings SET is_deleted = 1
     WHERE building_id = ? AND is_deleted = 0`,
    [building_id]
  );
  return result.affectedRows;
};