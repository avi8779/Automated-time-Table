import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  findAdminByUsername,
  findTeacherByEmail,
  findStudentByRollNumber,
  setTeacherPassword,
  createStudent,
  getAllStudents,
  softDeleteStudent,
} from "../model/auth.model.js";

const JWT_SECRET  = process.env.JWT_SECRET || "timetable_secret_key";
const JWT_EXPIRES = process.env.JWT_EXPIRES || "7d";

const signToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

/* ── ADMIN LOGIN  POST /api/v1/auth/admin/login ── */
export const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password required" });

    const admin = await findAdminByUsername(username);
    if (!admin)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = signToken({ id: admin.admin_id, role: "admin", name: admin.name, mustChangePassword: !!admin.must_change_password });
    res.json({
      success: true,
      token,
      user: { id: admin.admin_id, name: admin.name, role: "admin", mustChangePassword: !!admin.must_change_password },
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── TEACHER LOGIN  POST /api/v1/auth/teacher/login ── */
export const teacherLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });

    const teacher = await findTeacherByEmail(email);
    if (!teacher)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    if (!teacher.password)
      return res.status(401).json({ success: false, message: "Password not set. Contact admin." });

    const match = await bcrypt.compare(password, teacher.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = signToken({ id: teacher.teacher_id, role: "teacher", name: teacher.name, mustChangePassword: !!teacher.must_change_password });
    res.json({
      success: true,
      token,
      user: { id: teacher.teacher_id, name: teacher.name, role: "teacher", mustChangePassword: !!teacher.must_change_password },
    });
  } catch (err) {
    console.error("Teacher login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── STUDENT LOGIN  POST /api/v1/auth/student/login ── */
export const studentLogin = async (req, res) => {
  try {
    const { roll_number, password } = req.body;
    if (!roll_number || !password)
      return res.status(400).json({ success: false, message: "Roll number and password required" });

    const student = await findStudentByRollNumber(roll_number);
    if (!student)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const match = await bcrypt.compare(password, student.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = signToken({
      id:              student.student_id,
      role:            "student",
      name:            student.name,
      section_id:      student.section_id,
      mustChangePassword: !!student.must_change_password,
    });
    res.json({
      success: true,
      token,
      user: {
        id:              student.student_id,
        name:            student.name,
        role:            "student",
        section_id:      student.section_id,
        section_name:    student.section_name,
        roll_number:     student.roll_number,
        mustChangePassword: !!student.must_change_password,
      },
    });
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── ADMIN: Create student  POST /api/v1/auth/students ── */
export const createStudentController = async (req, res) => {
  try {
    const { roll_number, password, name, email, section_id } = req.body;
    if (!roll_number || !password || !name || !email || !section_id)
      return res.status(400).json({ success: false, message: "All fields required" });

    const hashed = await bcrypt.hash(password, 10);
    const id = await createStudent({ roll_number, password: hashed, name, email, section_id });
    res.status(201).json({ success: true, message: "Student created", student_id: id });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY")
      return res.status(409).json({ success: false, message: "Roll number already exists" });
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── ADMIN: Get all students  GET /api/v1/auth/students ── */
export const getStudentsController = async (_req, res) => {
  try {
    const students = await getAllStudents();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── ADMIN: Delete student  DELETE /api/v1/auth/students/:id ── */
export const deleteStudentController = async (req, res) => {
  try {
    const rows = await softDeleteStudent(req.params.id);
    if (!rows) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, message: "Student deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ── ADMIN: Set teacher password  PUT /api/v1/auth/teacher/:id/password ── */
export const setTeacherPasswordController = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password)
      return res.status(400).json({ success: false, message: "Password required" });

    const hashed = await bcrypt.hash(password, 10);
    await setTeacherPassword(req.params.id, hashed);
    res.json({ success: true, message: "Teacher password updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
