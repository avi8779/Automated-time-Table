import { pool } from "../config/dbConn.js";

// ── ADMIN ──────────────────────────────────────────────────────
export const findAdminByUsername = async (username) => {
  const [rows] = await pool.query(
    "SELECT * FROM admins WHERE username = ? AND is_deleted = 0",
    [username]
  );
  return rows[0];
};

// ── TEACHER ───────────────────────────────────────────────────
export const findTeacherByEmail = async (email) => {
  const [rows] = await pool.query(
    "SELECT * FROM teachers WHERE email = ? AND is_deleted = 0",
    [email]
  );
  return rows[0];
};

export const setTeacherPassword = async (teacher_id, hashedPassword) => {
  await pool.query(
    "UPDATE teachers SET password = ? WHERE teacher_id = ?",
    [hashedPassword, teacher_id]
  );
};

// ── STUDENT ───────────────────────────────────────────────────
export const findStudentByRollNumber = async (roll_number) => {
  const [rows] = await pool.query(
    `SELECT s.*, sec.section_name, sec.semester,
            c.course_name, d.name AS department_name
     FROM students s
     JOIN sections   sec ON sec.section_id = s.section_id
     JOIN courses    c   ON c.course_id    = sec.course_id
     JOIN department d   ON d.depart_id    = c.depart_id
     WHERE s.roll_number = ? AND s.is_deleted = 0`,
    [roll_number]
  );
  return rows[0];
};

export const createStudent = async (data) => {
  const { roll_number, password, name, email, section_id } = data;
  const [result] = await pool.query(
    "INSERT INTO students (roll_number, password, name, email, section_id) VALUES (?,?,?,?,?)",
    [roll_number, password, name, email, section_id]
  );
  return result.insertId;
};

export const getAllStudents = async () => {
  const [rows] = await pool.query(
    `SELECT s.student_id, s.roll_number, s.name, s.email,
            sec.section_name, sec.semester, c.course_name
     FROM students s
     JOIN sections sec ON sec.section_id = s.section_id
     JOIN courses  c   ON c.course_id    = sec.course_id
     WHERE s.is_deleted = 0
     ORDER BY s.roll_number`
  );
  return rows;
};

export const softDeleteStudent = async (student_id) => {
  const [result] = await pool.query(
    "UPDATE students SET is_deleted = 1 WHERE student_id = ? AND is_deleted = 0",
    [student_id]
  );
  return result.affectedRows;
};
