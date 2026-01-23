import { Router } from "express";
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection
} from "../Controller/section.controller.js";

const router = Router();

router.post("/", createSection);
router.get("/", getAllSections);
router.get("/:id", getSectionById);
router.put("/:id", updateSection);
router.delete("/:id", deleteSection);

export default router;
