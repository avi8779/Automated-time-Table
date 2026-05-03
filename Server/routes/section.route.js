import { Router } from "express";
import {
  createSectionController,
  getAllSectionsController,
  getDeletedSectionsController,
  getSectionByIdController,
  updateSectionController,
  deleteSectionController,
  restoreSectionController
} from "../Controller/section.controller.js";

const router = Router();

router.post("/", createSectionController);
router.get("/", getAllSectionsController);
router.get("/deleted", getDeletedSectionsController);
router.patch("/:id/restore", restoreSectionController);
router.get("/:id", getSectionByIdController);
router.put("/:id", updateSectionController);
router.delete("/:id", deleteSectionController);

export default router;
