import { Router } from "express";
import {
  createTimeSlot,
  getAllSlots,
  getSlotsByDay
} from "../Controller/timeSlots.controller.js";

const router = Router();

router.post("/", createTimeSlot);
router.get("/", getAllSlots);
router.get("/day/:day", getSlotsByDay);

export default router;
