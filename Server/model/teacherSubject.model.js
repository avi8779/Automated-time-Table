import { pool } from "../config/dbConn.js";

/* ── helpers ── */
export const teacherExistsById = async (teacher_id) => {
  const [rows] = await pool.query(
    "SELECT teacher_id FROM teachers WHERE teacher_id = ? AND is_deleted = 0",
    [teacher_id]
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

export const mappingExists = async (teacher_id, subject_id) => {
  const [rows] = await pool.query(
    `SELECT teacher_id FROM teacher_subject
     WHERE teacher_id = ? AND subject_id = ? AND is_deleted = 0`,
    [teacher_id, subject_id]
  );
  return rows.length > 0;
};

/* ── create ── */
export const createMapping = async (teacher_id, subject_id) => {
  await pool.query(
    `INSERT INTO teacher_subject (teacher_id, subject_id) VALUES (?, ?)`,
    [teacher_id, subject_id]
  );
};

/* ── get all mappings ── */
export const getAllMappings = async () => {
  const [rows] = await pool.query(
    `SELECT
       t.teacher_id,
       t.name        AS teacher_name,
       t.teacher_code,
       s.subject_id,
       s.subject_name,
       s.subject_code
     FROM teacher_subject ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     JOIN subjects s ON s.subject_id = ts.subject_id
     WHERE ts.is_deleted = 0
       AND t.is_deleted  = 0
       AND s.is_deleted  = 0
     ORDER BY t.name, s.subject_name`
  );
  return rows;
};

/* ── get subjects by teacher ── */
export const getSubjectsByTeacher = async (teacher_id) => {
  const [rows] = await pool.query(
    `SELECT
       ts.teacher_id,
       ts.subject_id,
       s.subject_code,
       s.subject_name,
       s.weekly_hours,
       s.is_lab,
       c.course_name
     FROM teacher_subject ts
     JOIN subjects s ON s.subject_id = ts.subject_id
     LEFT JOIN courses c ON c.course_id = s.course_id
     WHERE ts.teacher_id = ?
       AND ts.is_deleted = 0
       AND s.is_deleted  = 0`,
    [teacher_id]
  );
  return rows;
};

/* ── get teachers by subject ── */
export const getTeachersBySubject = async (subject_id) => {
  const [rows] = await pool.query(
    `SELECT
       t.teacher_id,
       t.teacher_code,
       t.name,
       t.email
     FROM teacher_subject ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     WHERE ts.subject_id = ?
       AND ts.is_deleted = 0
       AND t.is_deleted  = 0`,
    [subject_id]
  );
  return rows;
};

/* ── soft delete by teacher_id + subject_id (no standalone id column) ── */
export const softDeleteMapping = async (teacher_id, subject_id) => {
  const [result] = await pool.query(
    `UPDATE teacher_subject SET is_deleted = 1
     WHERE teacher_id = ? AND subject_id = ? AND is_deleted = 0`,
    [teacher_id, subject_id]
  );
  return result.affectedRows;
};