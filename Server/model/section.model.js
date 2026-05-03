import { pool } from "../config/dbConn.js";

/* ===================== HELPERS ===================== */

// check if section name already exists
export const sectionNameExists = async (section_name) => {
  const [rows] = await pool.query(
    "SELECT section_id FROM sections WHERE section_name = ? AND is_deleted = 0",
    [section_name]
  );
  return rows.length > 0;
};

export const getSectionConflict = async (course_id, batch_year, section_name, exclude_section_id = null) => {
  const params = [course_id, batch_year, section_name];
  let sql = `
    SELECT section_id, is_deleted
    FROM sections
    WHERE course_id = ?
      AND batch_year = ?
      AND section_name = ?
  `;

  if (exclude_section_id) {
    sql += " AND section_id != ?";
    params.push(exclude_section_id);
  }

  sql += " LIMIT 1";
  const [rows] = await pool.query(sql, params);
  return rows[0] || null;
};

// check if course exists
export const courseExistsById = async (course_id) => {
  const [rows] = await pool.query(
    "SELECT course_id FROM courses WHERE course_id = ? AND is_deleted = 0",
    [course_id]
  );
  return rows.length > 0;
};

/* ===================== CREATE ===================== */

export const createSection = async (data) => {
  const {
    section_name,
    course_id,
    semester,
    strength,
    batch_year,
    max_slots_per_day,
    status
  } = data;

  const [result] = await pool.query(
    `INSERT INTO sections
     (section_name, course_id, semester, strength, batch_year, max_slots_per_day, status)
     VALUES (?,?,?,?,?,?,?)`,
    [section_name, course_id, semester, strength, batch_year, max_slots_per_day ?? 6, status]
  );

  return result.insertId;
};

/* ===================== GET ALL ===================== */

export const getAllSections = async () => {
  const [rows] = await pool.query(
    `SELECT 
       s.section_id,
       s.section_name,
       s.course_id,
       s.semester,
       s.strength,
       s.batch_year,
       s.max_slots_per_day,
       s.status,
       c.course_code,
       c.course_name
     FROM sections s
     LEFT JOIN courses c ON c.course_id = s.course_id
     WHERE s.is_deleted = 0`
  );

  return rows;
};

export const getDeletedSections = async () => {
  const [rows] = await pool.query(
    `SELECT 
       s.section_id,
       s.section_name,
       s.course_id,
       s.semester,
       s.strength,
       s.batch_year,
       s.max_slots_per_day,
       s.status,
       c.course_code,
       c.course_name
     FROM sections s
     LEFT JOIN courses c ON c.course_id = s.course_id
     WHERE s.is_deleted = 1
     ORDER BY s.section_name`
  );

  return rows;
};

/* ===================== GET ONE ===================== */

export const getSectionById = async (section_id) => {
  const [rows] = await pool.query(
    "SELECT * FROM sections WHERE section_id = ? AND is_deleted = 0",
    [section_id]
  );

  return rows[0];
};

/* ===================== UPDATE ===================== */

export const updateSection = async (section_id, data) => {
  const {
    section_name,
    course_id,
    semester,
    strength,
    batch_year,
    max_slots_per_day,
    status
  } = data;

  const [result] = await pool.query(
    `UPDATE sections
     SET section_name = ?, course_id = ?, semester = ?, strength = ?, batch_year = ?, max_slots_per_day = ?, status = ?
     WHERE section_id = ? AND is_deleted = 0`,
    [
      section_name,
      course_id,
      semester,
      strength,
      batch_year,
      max_slots_per_day ?? 6,
      status,
      section_id
    ]
  );

  return result.affectedRows;
};

/* ===================== SOFT DELETE ===================== */

export const softDeleteSection = async (section_id) => {
  const [result] = await pool.query(
    "UPDATE sections SET is_deleted = 1 WHERE section_id = ? AND is_deleted = 0",
    [section_id]
  );

  return result.affectedRows;
};

export const restoreSection = async (section_id) => {
  const [result] = await pool.query(
    "UPDATE sections SET is_deleted = 0 WHERE section_id = ? AND is_deleted = 1",
    [section_id]
  );

  return result.affectedRows;
};

export const restoreSectionWithData = async (section_id, data) => {
  const {
    section_name,
    course_id,
    semester,
    strength,
    batch_year,
    max_slots_per_day,
    status
  } = data;

  const [result] = await pool.query(
    `UPDATE sections
     SET section_name = ?, course_id = ?, semester = ?, strength = ?, batch_year = ?, max_slots_per_day = ?, status = ?, is_deleted = 0
     WHERE section_id = ? AND is_deleted = 1`,
    [
      section_name,
      course_id,
      semester,
      strength,
      batch_year,
      max_slots_per_day ?? 6,
      status,
      section_id
    ]
  );

  return result.affectedRows;
};
