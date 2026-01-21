import { pool } from "../config/dbConn.js";

/* helpers */
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

export const departmentExistsById = async (depart_id) => {
  const [rows] = await pool.query(
    "SELECT depart_id FROM department WHERE depart_id = ? AND is_deleted = 0",
    [depart_id]
  );
  return rows.length > 0;
};

/* create */
export const createSubject = async (data) => {
  const {
    subject_code,
    name,
    course_id,
    depart_id,
    weekly_hours,
    is_lab
  } = data;

  const [result] = await pool.query(
    `INSERT INTO subjects
     (subject_code, name, course_id, depart_id, weekly_hours, is_lab)
     VALUES (?,?,?,?,?,?)`,
    [subject_code, name, course_id, depart_id, weekly_hours, is_lab]
  );

  return result.insertId;
};

/* get all */
export const getAllSubjects = async () => {
  const [rows] = await pool.query(
    `SELECT 
       s.subject_id,
       s.subject_code,
       s.name,
       s.weekly_hours,
       s.is_lab,
       c.course_name,
       d.name AS department_name
     FROM subjects s
     JOIN courses c ON c.course_id = s.course_id
     JOIN department d ON d.depart_id = s.depart_id
     WHERE s.is_deleted = 0`
  );
  return rows;
};

/* get one */
export const getSubjectById = async (subject_id) => {
  const [rows] = await pool.query(
    `SELECT * FROM subjects 
     WHERE subject_id = ? AND is_deleted = 0`,
    [subject_id]
  );
  return rows[0];
};

/* update */
export const updateSubject = async (subject_id, data) => {
  const {
    subject_code,
    name,
    course_id,
    depart_id,
    weekly_hours,
    is_lab
  } = data;

  const [result] = await pool.query(
    `UPDATE subjects
     SET subject_code = ?, name = ?, course_id = ?, depart_id = ?,
         weekly_hours = ?, is_lab = ?
     WHERE subject_id = ? AND is_deleted = 0`,
    [
      subject_code,
      name,
      course_id,
      depart_id,
      weekly_hours,
      is_lab,
      subject_id
    ]
  );

  return result.affectedRows;
};

/* soft delete */
export const softDeleteSubject = async (subject_id) => {
  const [result] = await pool.query(
    "UPDATE subjects SET is_deleted = 1 WHERE subject_id = ? AND is_deleted = 0",
    [subject_id]
  );
  return result.affectedRows;
};
