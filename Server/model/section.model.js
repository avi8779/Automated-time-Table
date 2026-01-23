import { pool } from "../config/dbConn.js";

/* helpers */
export const sectionCodeExists = async (section_code) => {
  const [rows] = await pool.query(
    "SELECT section_id FROM sections WHERE section_code = ? AND is_deleted = 0",
    [section_code]
  );
  return rows.length > 0;
};

export const courseExistsById = async (course_id) => {
  const [rows] = await pool.query(
    "SELECT course_id FROM courses WHERE course_id = ? AND is_deleted = 0",
    [course_id]
  );
  return rows.length > 0;
};

/* create */
export const createSection = async (data) => {
  const { section_code, name, course_id, year, strength } = data;

  const [result] = await pool.query(
    `INSERT INTO sections
     (section_code, name, course_id, year, strength)
     VALUES (?,?,?,?,?)`,
    [section_code, name, course_id, year, strength]
  );

  return result.insertId;
};

/* get all */
export const getAllSections = async () => {
  const [rows] = await pool.query(
    `SELECT 
       s.section_id,
       s.section_code,
       s.name,
       s.year,
       s.strength,
       c.course_name
     FROM sections s
     JOIN courses c ON c.course_id = s.course_id
     WHERE s.is_deleted = 0`
  );
  return rows;
};

/* get one */
export const getSectionById = async (section_id) => {
  const [rows] = await pool.query(
    "SELECT * FROM sections WHERE section_id = ? AND is_deleted = 0",
    [section_id]
  );
  return rows[0];
};

/* update */
export const updateSection = async (section_id, data) => {
  const { section_code, name, course_id, year, strength } = data;

  const [result] = await pool.query(
    `UPDATE sections
     SET section_code = ?, name = ?, course_id = ?, year = ?, strength = ?
     WHERE section_id = ? AND is_deleted = 0`,
    [section_code, name, course_id, year, strength, section_id]
  );

  return result.affectedRows;
};

/* soft delete */
export const softDeleteSection = async (section_id) => {
  const [result] = await pool.query(
    "UPDATE sections SET is_deleted = 1 WHERE section_id = ? AND is_deleted = 0",
    [section_id]
  );
  return result.affectedRows;
};
