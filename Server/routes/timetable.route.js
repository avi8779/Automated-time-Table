import { Router } from "express";
import {
  generateTimetableController,
  getTimetableBySection,
  getTimetableByTeacher,
  getAllTimetablesController,
  getSectionsWithDepartmentController,
} from "../Controller/timetable.controller.js";

const router = Router();

router.post("/generate",                generateTimetableController);
router.get("/sections",                 getSectionsWithDepartmentController);
router.get("/section/:section_id",      getTimetableBySection);
router.get("/teacher/:teacher_id",      getTimetableByTeacher);
router.get("/",                         getAllTimetablesController);

export default router;