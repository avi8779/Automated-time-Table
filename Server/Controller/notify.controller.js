import bcrypt from "bcrypt";
import { pool } from "../config/dbConn.js";
import { sendCredentialsEmail } from "../Services/email.service.js";

const LOGIN_URL = process.env.FRONTEND_URL || "http://localhost:5173/login";

/* ── GET /api/v1/notify/recipients ── */
export const getRecipients = async (_req, res) => {
  try {
    const [teachers] = await pool.query(
      `SELECT
         teacher_id  AS id,
         name,
         email,
         'teacher'   AS role,
         COALESCE(must_change_password, 1) AS must_change_password,
         (password IS NOT NULL)            AS has_password
       FROM teachers
       WHERE is_deleted = 0
         AND email IS NOT NULL
         AND email != ''
       ORDER BY name`
    );

    const [students] = await pool.query(
      `SELECT
         s.student_id  AS id,
         s.name,
         COALESCE(s.email, '') AS email,
         'student'     AS role,
         s.roll_number,
         COALESCE(s.must_change_password, 1) AS must_change_password,
         (s.password IS NOT NULL)             AS has_password,
         sec.section_name
       FROM students s
       LEFT JOIN sections sec ON sec.section_id = s.section_id
       WHERE s.is_deleted = 0
       ORDER BY s.name`
    );

    res.json({ success: true, data: { teachers, students } });
  } catch (err) {
    console.error("getRecipients error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/v1/notify/send ── */
export const sendCredentials = async (req, res) => {
  try {
    const { recipients } = req.body;
    if (!recipients?.length)
      return res.status(400).json({ success: false, message: "No recipients provided" });

    const results = { sent: [], failed: [] };

    for (const r of recipients) {
      if (!r.email) {
        results.failed.push({ name: r.name, reason: "No email address" });
        continue;
      }
      try {
        await sendCredentialsEmail({
          to:          r.email,
          name:        r.name,
          role:        r.role,
          identifier:  r.identifier,
          password:    r.tempPassword,
          loginUrl:    LOGIN_URL,
        });
        results.sent.push(r.name);
      } catch (err) {
        results.failed.push({ name: r.name, reason: err.message });
      }
    }

    res.json({
      success: true,
      sent:    results.sent.length,
      failed:  results.failed,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── POST /api/v1/notify/reset-password ── */
export const resetPassword = async (req, res) => {
  try {
    const { id, role, newPassword } = req.body;
    if (!id || !role || !newPassword)
      return res.status(400).json({ success: false, message: "id, role, newPassword required" });

    const hashed = await bcrypt.hash(newPassword, 10);
    const table  = role === "teacher" ? "teachers" : "students";
    const idCol  = role === "teacher" ? "teacher_id" : "student_id";

    await pool.query(
      `UPDATE ${table} SET password = ?, must_change_password = 1 WHERE ${idCol} = ?`,
      [hashed, id]
    );

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ── PUT /api/v1/notify/change-password ── */
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { id, role }    = req.user;

    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const hashed = await bcrypt.hash(newPassword, 10);
    const table  = role === "teacher" ? "teachers" : role === "student" ? "students" : "admins";
    const idCol  = role === "teacher" ? "teacher_id" : role === "student" ? "student_id" : "admin_id";

    await pool.query(
      `UPDATE ${table} SET password = ?, must_change_password = 0 WHERE ${idCol} = ?`,
      [hashed, id]
    );

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};