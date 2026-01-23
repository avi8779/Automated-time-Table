import { pool } from "../config/dbConn.js";

export const roomCodeExists = async (room_code) => {
  const [rows] = await pool.query(
    "SELECT room_id FROM rooms WHERE room_code = ? AND is_deleted = 0",
    [room_code]
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

export const createRoom = async (data) => {
  const { room_code, building_id, capacity, room_type } = data;

  const [result] = await pool.query(
    `INSERT INTO rooms
     (room_code, building_id, capacity, room_type)
     VALUES (?,?,?,?)`,
    [room_code, building_id, capacity, room_type]
  );

  return result.insertId;
};

export const getAllRooms = async () => {
  const [rows] = await pool.query(
    `SELECT 
       r.room_id,
       r.room_code,
       r.capacity,
       r.room_type,
       b.name AS building_name
     FROM rooms r
     JOIN buildings b ON b.building_id = r.building_id
     WHERE r.is_deleted = 0`
  );
  return rows;
};
