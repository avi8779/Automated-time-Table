import { Router } from "express";

import {
  createTeacher,
  getAllTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  restoreTeacher
} from "../Controller/teacher.controller.js";

const router = Router();

router.post("/", createTeacher);
router.get("/", getAllTeachers);
router.get("/:id", getTeacherById);        
router.put("/:id", updateTeacher);
router.delete("/:id", deleteTeacher);
router.patch("/:id/restore", restoreTeacher);



export default router;
