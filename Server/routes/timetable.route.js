import { Router } from "express";
import {
  generateTimetableController,
  sendTimetableEmailController,
  getTimetableBySection,
  getTimetableByTeacher,
  getAllTimetablesController,
  getSectionsWithDepartmentController,
} from "../Controller/timetable.controller.js";
import { restrictTo } from "../middleware/auth.middleware.js";

const router = Router();

// Admin only — generate
router.post("/generate",             restrictTo("admin"), generateTimetableController);
router.post("/send-timetable-email", restrictTo("admin"), sendTimetableEmailController);

// All authenticated roles can read
router.get("/sections",              getSectionsWithDepartmentController);
router.get("/section/:section_id",   getTimetableBySection);
router.get("/teacher/:teacher_id",   getTimetableByTeacher);
router.get("/",                      restrictTo("admin"), getAllTimetablesController);

export default router;
