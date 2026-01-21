import { pool } from "../config/dbConn.js";

/* helpers */
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
    `SELECT id FROM teacher_subjects 
     WHERE teacher_id = ? AND subject_id = ? AND is_deleted = 0`,
    [teacher_id, subject_id]
  );
  return rows.length > 0;
};

/* create */
export const createMapping = async (teacher_id, subject_id) => {
  const [result] = await pool.query(
    `INSERT INTO teacher_subjects (teacher_id, subject_id)
     VALUES (?, ?)`,
    [teacher_id, subject_id]
  );
  return result.insertId;
};

/* get subjects by teacher */
export const getSubjectsByTeacher = async (teacher_id) => {
  const [rows] = await pool.query(
    `SELECT 
       s.subject_id,
       s.subject_code,
       s.name,
       s.weekly_hours,
       s.is_lab
     FROM teacher_subjects ts
     JOIN subjects s ON s.subject_id = ts.subject_id
     WHERE ts.teacher_id = ? AND ts.is_deleted = 0`,
    [teacher_id]
  );
  return rows;
};

/* get teachers by subject */
export const getTeachersBySubject = async (subject_id) => {
  const [rows] = await pool.query(
    `SELECT 
       t.teacher_id,
       t.teacher_code,
       t.name,
       t.email
     FROM teacher_subjects ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     WHERE ts.subject_id = ? AND ts.is_deleted = 0`,
    [subject_id]
  );
  return rows;
};

/* soft delete */
export const softDeleteMapping = async (teacher_id, subject_id) => {
  const [result] = await pool.query(
    `UPDATE teacher_subjects 
     SET is_deleted = 1 
     WHERE teacher_id = ? AND subject_id = ? AND is_deleted = 0`,
    [teacher_id, subject_id]
  );
  return result.affectedRows;
};
