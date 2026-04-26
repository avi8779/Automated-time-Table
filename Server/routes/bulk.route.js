import { Router } from "express";
import multer from "multer";
import {
  bulkBuildings,
  bulkRooms,
  bulkCourses,
  bulkTeachers,
  bulkSubjects,
  bulkSections,
  bulkStudents,
  bulkTeacherSubjects,
  downloadTemplate,
} from "../Controller/bulk.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

const router  = Router();
const upload  = multer({ storage: multer.memoryStorage() });

// All bulk routes — admin only
router.use(protect, restrictTo("admin"));

// Template downloads
router.get("/template/:entity", downloadTemplate);

// Bulk uploads
router.post("/buildings",        upload.single("file"), bulkBuildings);
router.post("/rooms",            upload.single("file"), bulkRooms);
router.post("/courses",          upload.single("file"), bulkCourses);
router.post("/teachers",         upload.single("file"), bulkTeachers);
router.post("/subjects",         upload.single("file"), bulkSubjects);
router.post("/sections",         upload.single("file"), bulkSections);
router.post("/students",         upload.single("file"), bulkStudents);
router.post("/teacher-subjects", upload.single("file"), bulkTeacherSubjects);

export default router;