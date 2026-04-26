import { pool } from "../config/dbConn.js";

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

/* ── CREATE building + auto-generate room slots ── */
export const createBuilding = async (data) => {
  const { building_code, building_name, floors, rooms_per_floor, status } = data;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO buildings (building_code, building_name, floors, rooms_per_floor, status)
       VALUES (?, ?, ?, ?, ?)`,
      [building_code, building_name, floors, rooms_per_floor, status]
    );
    const building_id = result.insertId;

    // Auto-generate room slot numbers: Floor 1 → 101,102... Floor 2 → 201,202...
    const slots = [];
    for (let f = 1; f <= floors; f++) {
      for (let r = 1; r <= rooms_per_floor; r++) {
        const room_no = `${f}${String(r).padStart(2, "0")}`;
        slots.push([building_id, f, room_no]);
      }
    }

    if (slots.length) {
      await connection.query(
        `INSERT IGNORE INTO building_room_slots (building_id, floor_no, room_no) VALUES ?`,
        [slots]
      );
    }

    await connection.commit();
    return building_id;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

/* ── READ ALL ── */
export const getAllBuildings = async () => {
  const [rows] = await pool.query(
    `SELECT b.building_id, b.building_code, b.building_name,
            b.floors, b.rooms_per_floor, b.status,
            COUNT(brs.slot_id)                                    AS total_slots,
            SUM(brs.is_configured)                                AS configured_rooms,
            (COUNT(brs.slot_id) - COALESCE(SUM(brs.is_configured),0)) AS available_slots
     FROM buildings b
     LEFT JOIN building_room_slots brs ON brs.building_id = b.building_id
     WHERE b.is_deleted = 0
     GROUP BY b.building_id
     ORDER BY b.building_id`
  );
  return rows;
};

export const getBuildingById = async (building_id) => {
  const [rows] = await pool.query(
    `SELECT building_id, building_code, building_name, floors, rooms_per_floor, status
     FROM buildings WHERE building_id = ? AND is_deleted = 0`,
    [building_id]
  );
  return rows[0];
};

/* ── GET unassigned room slots for a building (for room creation dropdown) ── */
export const getAvailableRoomSlots = async (building_id) => {
  const [rows] = await pool.query(
    `SELECT slot_id, floor_no, room_no
     FROM building_room_slots
     WHERE building_id = ? AND is_configured = 0
     ORDER BY floor_no, room_no`,
    [building_id]
  );
  return rows;
};

/* ── GET all slots for a building grouped by floor ── */
export const getRoomSlotsByBuilding = async (building_id) => {
  const [rows] = await pool.query(
    `SELECT brs.slot_id, brs.floor_no, brs.room_no, brs.is_configured,
            r.room_id, r.room_type, r.capacity
     FROM building_room_slots brs
     LEFT JOIN rooms r ON r.room_no = brs.room_no AND r.building_id = brs.building_id AND r.is_deleted = 0
     WHERE brs.building_id = ?
     ORDER BY brs.floor_no, brs.room_no`,
    [building_id]
  );
  return rows;
};

/* ── Mark slot as configured when room is created ── */
export const markSlotConfigured = async (building_id, room_no) => {
  await pool.query(
    `UPDATE building_room_slots SET is_configured = 1
     WHERE building_id = ? AND room_no = ?`,
    [building_id, room_no]
  );
};

/* ── Unmark slot if room is deleted ── */
export const markSlotAvailable = async (building_id, room_no) => {
  await pool.query(
    `UPDATE building_room_slots SET is_configured = 0
     WHERE building_id = ? AND room_no = ?`,
    [building_id, room_no]
  );
};

/* ── UPDATE ── */
export const updateBuilding = async (building_id, data) => {
  const { building_code, building_name, floors, rooms_per_floor, status } = data;
  const [result] = await pool.query(
    `UPDATE buildings
     SET building_code = ?, building_name = ?, floors = ?, rooms_per_floor = ?, status = ?
     WHERE building_id = ? AND is_deleted = 0`,
    [building_code, building_name, floors, rooms_per_floor, status, building_id]
  );
  return result.affectedRows;
};

/* ── DELETE (soft) ── */
export const softDeleteBuilding = async (building_id) => {
  const [result] = await pool.query(
    `UPDATE buildings SET is_deleted = 1 WHERE building_id = ? AND is_deleted = 0`,
    [building_id]
  );
  return result.affectedRows;
};