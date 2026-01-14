import { pool } from "../config/dbConn.js";

export const createCourse = async ({
  course_code,
  course_name,
  depart_id,
  duration_years
}) => {
  const [result] = await pool.query(
    `INSERT INTO courses 
     (course_code, course_name, depart_id, duration_years)
     VALUES (?,?,?,?)`,
    [course_code, course_name, depart_id, duration_years]
  );

  return result.insertId;
};

export const updateCourse = async (course_id, data) => {
  const { course_code, course_name, depart_id, duration_years } = data;

  const [result] = await pool.query(
    `UPDATE courses 
     SET course_code = ?, course_name = ?, depart_id = ?, duration_years = ?
     WHERE course_id = ? AND is_deleted = 0`,
    [course_code, course_name, depart_id, duration_years, course_id]
  );

  return result.affectedRows;
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


export const getAllCourses = async () => {
  const [rows] = await pool.query(
    `SELECT 
       c.course_id,
       c.course_code,
       c.course_name,
       c.duration_years,
       d.depart_id,
       d.department_code,
       d.name AS department_name
     FROM courses c
     JOIN department d ON d.depart_id = c.depart_id
     WHERE c.is_deleted = 0`
  );
  return rows;
};

export const getCourseById = async (course_id) => {
  const [rows] = await pool.query(
    `SELECT 
       c.course_id,
       c.course_code,
       c.course_name,
       c.duration_years,
       d.depart_id,
       d.department_code,
       d.name AS department_name
     FROM courses c
     JOIN department d ON d.depart_id = c.depart_id
     WHERE c.course_id = ? AND c.is_deleted = 0`,
    [course_id]
  );
  return rows[0];
};


export const softDeleteCourse = async (course_id) => {
  const [result] = await pool.query(
    `UPDATE courses 
     SET is_deleted = 1 
     WHERE course_id = ? AND is_deleted = 0`,
    [course_id]
  );
  return result.affectedRows;
};

export const restoreCourse = async (course_id) => {
  const [result] = await pool.query(
    "UPDATE courses SET is_deleted = 0 WHERE course_id = ? AND is_deleted = 1",
    [course_id]
  );
  return result.affectedRows;
};

export const getDeletedCourses = async () => {
  const [rows] = await pool.query(
    `SELECT 
       course_id,
       course_code,
       course_name,
       duration,
       depart_id
     FROM courses
     WHERE is_deleted = 1`
  );
  return rows;
};



