import { Router } from "express";
import {
  getAllCourses,
  getCourseById,
  deleteCourse,
  updateCourse,   
  createCourse,
  restoreCourse,
  getDeletedCourses    
} from "../Controller/course.controller.js";

const router = Router();

router.post("/", createCourse);
router.get("/", getAllCourses);
router.get("/deleted", getDeletedCourses);
router.get("/:id", getCourseById);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);
router.patch("/:id/restore", restoreCourse);




export default router;
