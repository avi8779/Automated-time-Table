import { pool } from "../config/dbConn.js";

/* create */
export const createTeacher = async (data) => {
  const {
    teacher_code,
    name,
    email,
    depart_id,
    max_hours_per_day,
    max_hours_per_week
  } = data;

  const [result] = await pool.query(
    `INSERT INTO teachers
     (teacher_code, name, email, depart_id, max_hours_per_day, max_hours_per_week)
     VALUES (?,?,?,?,?,?)`,
    [
      teacher_code,
      name,
      email,
      depart_id,
      max_hours_per_day,
      max_hours_per_week
    ]
  );

  return result.insertId;
};

/* helpers */
export const teacherExistsByCode = async (teacher_code) => {
  const [rows] = await pool.query(
    "SELECT teacher_id FROM teachers WHERE teacher_code = ?",
    [teacher_code]
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

/* get all */
export const getAllTeachers = async () => {
  const [rows] = await pool.query(
    `SELECT 
       t.teacher_id,
       t.teacher_code,
       t.name,
       t.email,
       t.max_hours_per_day,
       t.max_hours_per_week,
       d.depart_id,
       d.department_code,
       d.name AS department_name
     FROM teachers t
     JOIN department d ON d.depart_id = t.depart_id
     WHERE t.is_deleted = 0`
  );
  return rows;
};

export const updateTeacher = async (teacher_id, data) => {
  const {
    teacher_code,
    name,
    email,
    depart_id,
    max_hours_per_day,
    max_hours_per_week
  } = data;

  const [result] = await pool.query(
    `UPDATE teachers
     SET teacher_code = ?, name = ?, email = ?, depart_id = ?,
         max_hours_per_day = ?, max_hours_per_week = ?
     WHERE teacher_id = ? AND is_deleted = 0`,
    [
      teacher_code,
      name,
      email,
      depart_id,
      max_hours_per_day,
      max_hours_per_week,
      teacher_id
    ]
  );

  return result.affectedRows;
};

export const teacherExistsById = async (teacher_id) => {
  const [rows] = await pool.query(
    "SELECT teacher_id FROM teachers WHERE teacher_id = ? AND is_deleted = 0",
    [teacher_id]
  );
  return rows.length > 0;
};

export const softDeleteTeacher = async (teacher_id) => {
  const [result] = await pool.query(
    "UPDATE teachers SET is_deleted = 1 WHERE teacher_id = ? AND is_deleted = 0",
    [teacher_id]
  );
  return result.affectedRows;
};

export const restoreTeacher = async (teacher_id) => {
  const [result] = await pool.query(
    "UPDATE teachers SET is_deleted = 0 WHERE teacher_id = ? AND is_deleted = 1",
    [teacher_id]
  );
  return result.affectedRows;
};

export const getTeacherById = async (teacher_id) => {
  const [rows] = await pool.query(
    `SELECT 
       t.teacher_id,
       t.teacher_code,
       t.name,
       t.email,
       t.max_hours_per_day,
       t.max_hours_per_week,
       d.depart_id,
       d.department_code,
       d.name AS department_name
     FROM teachers t
     JOIN department d ON d.depart_id = t.depart_id
     WHERE t.teacher_id = ? AND t.is_deleted = 0`,
    [teacher_id]
  );

  return rows[0]; 
};


