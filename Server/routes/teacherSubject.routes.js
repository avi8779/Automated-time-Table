import { Router } from "express";
import {
  getAllMappingsController,
  getSubjectsByTeacherController,
  assignSubjectController,
  removeTeacherSubjectController,
} from "../Controller/teacherSubject.controller.js";

const router = Router();

router.get("/",                            getAllMappingsController);
router.get("/teacher/:teacher_id",         getSubjectsByTeacherController);
router.post("/",                           assignSubjectController);
router.delete("/:teacher_id/:subject_id",              removeTeacherSubjectController);
router.delete("/:teacher_id/:subject_id/:section_id",  removeTeacherSubjectController);

export default router;