import { pool } from "../config/dbConn.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

export const roomNoExists = async (room_no, building_id, exclude_room_id = null) => {
  const params = [room_no, building_id];
  let sql = "SELECT room_id FROM rooms WHERE room_no = ? AND building_id = ? AND is_deleted = 0";

  if (exclude_room_id) {
    sql += " AND room_id != ?";
    params.push(exclude_room_id);
  }

  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
};

export const buildingExistsById = async (building_id) => {
  const [rows] = await pool.query(
    "SELECT building_id FROM buildings WHERE building_id = ? AND is_deleted = 0",
    [building_id]
  );
  return rows.length > 0;
};

export const roomExistsById = async (room_id) => {
  const [rows] = await pool.query(
    "SELECT room_id FROM rooms WHERE room_id = ? AND is_deleted = 0",
    [room_id]
  );
  return rows.length > 0;
};

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createRoom = async (data) => {
  const {
    room_no,
    building_id,
    capacity,
    room_type,
    floor_no,
    status,
    has_projector,
    has_ac,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO rooms
     (room_no, building_id, capacity, room_type, floor_no, status, has_projector, has_ac)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [room_no, building_id, capacity, room_type, floor_no, status, has_projector, has_ac]
  );

  return result.insertId;
};

// ── READ ──────────────────────────────────────────────────────────────────────

export const getAllRooms = async () => {
  const [rows] = await pool.query(
    `SELECT
       r.room_id,
       r.room_no,
       r.capacity,
       r.room_type,
       r.floor_no,
       r.status,
       r.has_projector,
       r.has_ac,
       b.building_name
     FROM rooms r
     JOIN buildings b ON b.building_id = r.building_id
     WHERE r.is_deleted = 0
     ORDER BY r.room_id ASC`
  );
  return rows;
};

export const getRoomById = async (room_id) => {
  const [rows] = await pool.query(
    `SELECT
       r.room_id,
       r.room_no,
       r.building_id,
       r.capacity,
       r.room_type,
       r.floor_no,
       r.status,
       r.has_projector,
       r.has_ac,
       b.building_name
     FROM rooms r
     JOIN buildings b ON b.building_id = r.building_id
     WHERE r.room_id = ? AND r.is_deleted = 0`,
    [room_id]
  );
  return rows[0];
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateRoom = async (room_id, data) => {
  const {
    room_no,
    building_id,
    capacity,
    room_type,
    floor_no,
    status,
    has_projector,
    has_ac,
  } = data;

  const [result] = await pool.query(
    `UPDATE rooms
     SET room_no = ?, building_id = ?, capacity = ?, room_type = ?,
         floor_no = ?, status = ?, has_projector = ?, has_ac = ?
     WHERE room_id = ? AND is_deleted = 0`,
    [room_no, building_id, capacity, room_type, floor_no, status, has_projector, has_ac, room_id]
  );

  return result.affectedRows;
};

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

export const softDeleteRoom = async (room_id) => {
  const [result] = await pool.query(
    "UPDATE rooms SET is_deleted = 1 WHERE room_id = ? AND is_deleted = 0",
    [room_id]
  );
  return result.affectedRows;
};
