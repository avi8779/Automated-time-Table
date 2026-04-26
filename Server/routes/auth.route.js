import { Router } from "express";
import {
  adminLogin,
  teacherLogin,
  studentLogin,
  createStudentController,
  getStudentsController,
  deleteStudentController,
  setTeacherPasswordController,
} from "../Controller/auth.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router = Router();

// Public login routes
router.post("/admin/login",   adminLogin);
router.post("/teacher/login", teacherLogin);
router.post("/student/login", studentLogin);

// Admin-only: manage students and teacher passwords
router.get("/students",              protect, restrictTo("admin"), getStudentsController);
router.post("/students",             protect, restrictTo("admin"), createStudentController);
router.delete("/students/:id",       protect, restrictTo("admin"), deleteStudentController);
router.put("/teacher/:id/password",  protect, restrictTo("admin"), setTeacherPasswordController);

export default router;