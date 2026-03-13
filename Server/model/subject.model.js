import { pool } from "../config/dbConn.js";

// ── Helpers ───────────────────────────────────────────────────────────────────

export const subjectCodeExists = async (subject_code) => {
  const [rows] = await pool.query(
    "SELECT subject_id FROM subjects WHERE subject_code = ? AND is_deleted = 0",
    [subject_code]
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

export const subjectExistsById = async (subject_id) => {
  const [rows] = await pool.query(
    "SELECT subject_id FROM subjects WHERE subject_id = ? AND is_deleted = 0",
    [subject_id]
  );
  return rows.length > 0;
};

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createSubject = async (data) => {
  const {
    subject_code,
    subject_name,
    course_id,
    semester,
    weekly_hours,
    credits,
    is_lab,
    preferred_slot,
    status,
  } = data;

  const [result] = await pool.query(
    `INSERT INTO subjects
     (subject_code, subject_name, course_id, semester, weekly_hours, credits, is_lab, preferred_slot, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [subject_code, subject_name, course_id, semester, weekly_hours, credits, is_lab, preferred_slot, status]
  );

  return result.insertId;
};

// ── READ ──────────────────────────────────────────────────────────────────────

export const getAllSubjects = async () => {
  const [rows] = await pool.query(
    `SELECT
       s.subject_id,
       s.subject_code,
       s.subject_name,
       s.semester,
       s.weekly_hours,
       s.credits,
       s.is_lab,
       s.preferred_slot,
       s.status,
       c.course_name
     FROM subjects s
     JOIN courses c ON c.course_id = s.course_id
     WHERE s.is_deleted = 0
     ORDER BY s.subject_id ASC`
  );
  return rows;
};

export const getSubjectById = async (subject_id) => {
  const [rows] = await pool.query(
    "SELECT * FROM subjects WHERE subject_id = ? AND is_deleted = 0",
    [subject_id]
  );
  return rows[0];
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateSubject = async (subject_id, data) => {
  const {
    subject_code,
    subject_name,
    course_id,
    semester,
    weekly_hours,
    credits,
    is_lab,
    preferred_slot,
    status,
  } = data;

  const [result] = await pool.query(
    `UPDATE subjects
     SET subject_code = ?, subject_name = ?, course_id = ?, semester = ?,
         weekly_hours = ?, credits = ?, is_lab = ?, preferred_slot = ?, status = ?
     WHERE subject_id = ? AND is_deleted = 0`,
    [
      subject_code, subject_name, course_id, semester,
      weekly_hours, credits, is_lab, preferred_slot, status,
      subject_id,
    ]
  );

  return result.affectedRows;
};

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

export const softDeleteSubject = async (subject_id) => {
  const [result] = await pool.query(
    "UPDATE subjects SET is_deleted = 1 WHERE subject_id = ? AND is_deleted = 0",
    [subject_id]
  );
  return result.affectedRows;
};