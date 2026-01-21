import { Router } from "express";
import {
  assignSubjectToTeacher,
  getSubjectsByTeacher,
  getTeachersBySubject,
  removeTeacherSubject
} from "../Controller/teacherSubject.controller.js";

const router = Router();

/* create mapping */
router.post("/", assignSubjectToTeacher);

/* queries */
router.get("/teacher/:teacher_id", getSubjectsByTeacher);
router.get("/subject/:subject_id", getTeachersBySubject);

/* delete mapping */
router.delete("/:teacher_id/:subject_id", removeTeacherSubject);

export default router;
