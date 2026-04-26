import { pool } from "../config/dbConn.js";

/* Get all subjects assigned to a teacher (with section info) */
export const getSubjectsByTeacher = async (teacher_id) => {
  const [rows] = await pool.query(
    `SELECT
       ts.teacher_id,
       ts.subject_id,
       ts.section_id,
       ts.priority,
       ts.can_substitute,
       s.subject_name,
       s.subject_code,
       s.weekly_hours,
       s.is_lab,
       c.course_name,
       sec.section_name,
       sec.semester,
       d.name AS department_name
     FROM teacher_subject ts
     JOIN subjects   s   ON s.subject_id   = ts.subject_id
     JOIN courses    c   ON c.course_id    = s.course_id
     LEFT JOIN sections  sec ON sec.section_id = ts.section_id
     LEFT JOIN department d  ON d.depart_id    = c.depart_id
     WHERE ts.teacher_id = ?
       AND ts.is_deleted  = 0
     ORDER BY sec.section_name, s.subject_name`,
    [teacher_id]
  );
  return rows;
};

/* Get all mappings (for admin overview) */
export const getAllMappings = async () => {
  const [rows] = await pool.query(
    `SELECT
       ts.teacher_id,
       ts.subject_id,
       ts.section_id,
       ts.priority,
       ts.can_substitute,
       t.name          AS teacher_name,
       s.subject_name,
       s.subject_code,
       s.is_lab,
       sec.section_name,
       sec.semester,
       c.course_name,
       d.name          AS department_name
     FROM teacher_subject ts
     JOIN teachers   t   ON t.teacher_id   = ts.teacher_id
     JOIN subjects   s   ON s.subject_id   = ts.subject_id
     LEFT JOIN sections  sec ON sec.section_id = ts.section_id
     LEFT JOIN courses   c   ON c.course_id    = s.course_id
     LEFT JOIN department d  ON d.depart_id    = c.depart_id
     WHERE ts.is_deleted = 0
     ORDER BY t.name, sec.section_name, s.subject_name`
  );
  return rows;
};

/* Assign teacher → subject → section */
export const createMapping = async ({ teacher_id, subject_id, section_id, priority, can_substitute }) => {
  const [result] = await pool.query(
    `INSERT INTO teacher_subject
     (teacher_id, subject_id, section_id, priority, can_substitute)
     VALUES (?,?,?,?,?)
     ON DUPLICATE KEY UPDATE
       priority        = VALUES(priority),
       can_substitute  = VALUES(can_substitute),
       is_deleted      = 0`,
    [teacher_id, subject_id, section_id || null, priority || 1, can_substitute ? 1 : 0]
  );
  return result;
};

/* Remove a mapping */
export const softDeleteMapping = async ({ teacher_id, subject_id, section_id }) => {
  const [result] = await pool.query(
    `UPDATE teacher_subject
     SET is_deleted = 1
     WHERE teacher_id = ?
       AND subject_id  = ?
       AND (section_id = ? OR (section_id IS NULL AND ? IS NULL))`,
    [teacher_id, subject_id, section_id || null, section_id || null]
  );
  return result.affectedRows;
};

/* Sections that have a specific subject available (for timetable generation) */
export const getTeachersForSubjectSection = async (subject_id, section_id) => {
  const [rows] = await pool.query(
    `SELECT t.teacher_id, t.name, t.max_hours_per_day, t.max_hours_per_week
     FROM teacher_subject ts
     JOIN teachers t ON t.teacher_id = ts.teacher_id
     WHERE ts.subject_id = ?
       AND (ts.section_id = ? OR ts.section_id IS NULL)
       AND ts.is_deleted  = 0
       AND t.is_deleted   = 0
     ORDER BY ts.priority`,
    [subject_id, section_id]
  );
  return rows;
};