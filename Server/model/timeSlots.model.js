import { pool } from "../config/dbConn.js";

/* ===========================
   CREATE
=========================== */

export const createTimeSlot = async (data) => {
  const { day, slot_order, start_time, end_time, is_break = 0 } = data;

  if (start_time >= end_time) {
    throw new Error("End time must be greater than start time");
  }

  const [result] = await pool.query(
    `INSERT INTO time_slots
     (day, slot_order, start_time, end_time, is_break)
     VALUES (?,?,?,?,?)`,
    [day, slot_order, start_time, end_time, is_break]
  );

  return result.insertId;
};

/* ===========================
   READ
=========================== */

export const getAllSlots = async () => {
  const [rows] = await pool.query(
    `SELECT *
     FROM time_slots
     WHERE deleted_at IS NULL
     ORDER BY day, slot_order`
  );
  return rows;
};

export const getSlotsByDay = async (day) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM time_slots
     WHERE day = ?
       AND deleted_at IS NULL
     ORDER BY slot_order`,
    [day]
  );
  return rows;
};

export const getSlotById = async (slotId) => {
  const [rows] = await pool.query(
    `SELECT *
     FROM time_slots
     WHERE slot_id = ?
       AND deleted_at IS NULL`,
    [slotId]
  );
  return rows[0] || null;
};

/* ===========================
   VALIDATION HELPERS
=========================== */

export const slotOrderExists = async (day, slot_order, excludeSlotId = null) => {
  let sql = `
    SELECT slot_id
    FROM time_slots
    WHERE day = ?
      AND slot_order = ?
      AND deleted_at IS NULL
  `;
  const params = [day, slot_order];

  if (excludeSlotId) {
    sql += " AND slot_id != ?";
    params.push(excludeSlotId);
  }

  const [rows] = await pool.query(sql, params);
  return rows.length > 0;
};

/* ===========================
   UPDATE
=========================== */

export const updateSlotTime = async (slotId, start_time, end_time) => {
  if (start_time >= end_time) {
    throw new Error("End time must be greater than start time");
  }

  const [result] = await pool.query(
    `UPDATE time_slots
     SET start_time = ?, end_time = ?, updated_at = NOW()
     WHERE slot_id = ? AND deleted_at IS NULL`,
    [start_time, end_time, slotId]
  );

  return result.affectedRows;
};

export const updateSlotOrder = async (day, slotId, newOrder) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [exists] = await connection.query(
      `SELECT slot_id FROM time_slots
       WHERE day = ?
         AND slot_order = ?
         AND slot_id != ?
         AND deleted_at IS NULL`,
      [day, newOrder, slotId]
    );

    if (exists.length > 0) {
      throw new Error("Slot order already exists for this day");
    }

    const [result] = await connection.query(
      `UPDATE time_slots
       SET slot_order = ?, updated_at = NOW()
       WHERE slot_id = ? AND deleted_at IS NULL`,
      [newOrder, slotId]
    );

    await connection.commit();
    return result.affectedRows;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

export const updateSlotBreak = async (slotId, is_break) => {
  const [result] = await pool.query(
    `UPDATE time_slots
     SET is_break = ?, updated_at = NOW()
     WHERE slot_id = ? AND deleted_at IS NULL`,
    [is_break ? 1 : 0, slotId]
  );

  return result.affectedRows;
};

export const updateSlotStatus = async (slotId, status) => {
  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    throw new Error("Invalid status value");
  }

  const [result] = await pool.query(
    `UPDATE time_slots
     SET status = ?, updated_at = NOW()
     WHERE slot_id = ? AND deleted_at IS NULL`,
    [status, slotId]
  );

  return result.affectedRows;
};

/* ===========================
   GENERIC UPDATE (ADMIN USE)
=========================== */

export const updateTimeSlot = async (slotId, data) => {
  const allowedFields = [
    "start_time",
    "end_time",
    "slot_order",
    "is_break",
    "status"
  ];

  const fields = [];
  const values = [];

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(data[key]);
    }
  }

  if (fields.length === 0) {
    throw new Error("No valid fields to update");
  }

  values.push(slotId);

  const [result] = await pool.query(
    `UPDATE time_slots
     SET ${fields.join(", ")}, updated_at = NOW()
     WHERE slot_id = ? AND deleted_at IS NULL`,
    values
  );

  return result.affectedRows;
};

/* ===========================
   DELETE (SOFT DELETE)
=========================== */

export const deleteSlot = async (slotId) => {
  const [result] = await pool.query(
    `UPDATE time_slots
     SET deleted_at = NOW(), updated_at = NOW()
     WHERE slot_id = ? AND deleted_at IS NULL`,
    [slotId]
  );

  return result.affectedRows;
};
