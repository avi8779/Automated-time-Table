import { Router } from "express";
import {
  assignSubjectToTeacher,
  getAllMappings,
  getSubjectsByTeacher,
  getTeachersBySubject,
  removeTeacherSubject,
} from "../Controller/teacherSubject.controller.js";

const router = Router();

router.get("/",                         getAllMappings);
router.post("/",                        assignSubjectToTeacher);
router.get("/teacher/:teacher_id",      getSubjectsByTeacher);
router.get("/subject/:subject_id",      getTeachersBySubject);
router.delete("/:teacher_id/:subject_id", removeTeacherSubject);

export default router;