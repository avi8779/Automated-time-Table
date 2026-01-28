import { pool } from "../config/dbConn.js";

export const slotExists = async (day, slot_order) => {
  const [rows] = await pool.query(
    `SELECT slot_id FROM time_slots 
     WHERE day = ? AND slot_order = ? AND is_deleted = 0`,
    [day, slot_order]
  );
  return rows.length > 0;
};

export const createTimeSlot = async (data) => {
  const { day, slot_order, start_time, end_time, slot_type } = data;

  const [result] = await pool.query(
    `INSERT INTO time_slots 
     (day, slot_order, start_time, end_time, slot_type)
     VALUES (?,?,?,?,?)`,
    [day, slot_order, start_time, end_time, slot_type]
  );

  return result.insertId;
};

export const getAllSlots = async () => {
  const [rows] = await pool.query(
    `SELECT * FROM time_slots 
     WHERE is_deleted = 0
     ORDER BY day, slot_order`
  );
  return rows;
};

export const getSlotsByDay = async (day) => {
  const [rows] = await pool.query(
    `SELECT * FROM time_slots 
     WHERE day = ? AND is_deleted = 0
     ORDER BY slot_order`,
    [day]
  );
  return rows;
};
