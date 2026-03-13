import { Router } from "express";
import {
  createSectionController,
  getAllSectionsController,
  getSectionByIdController,
  updateSectionController,
  deleteSectionController
} from "../Controller/section.controller.js";

const router = Router();

router.post("/", createSectionController);
router.get("/", getAllSectionsController);
router.get("/:id", getSectionByIdController);
router.put("/:id", updateSectionController);
router.delete("/:id", deleteSectionController);

export default router;
