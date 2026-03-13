import express from "express";
import {
  createTimeSlot,
  getAllSlots,
  getSlotById,
  getSlotsByDay,
  updateSlotTime,
  updateSlotOrder,
  updateSlotBreak,
  updateSlotStatus,
  updateTimeSlot,
  deleteSlot
} from "../Controller/timeSlots.controller.js";

const router = express.Router();

/* ===========================
   CREATE
=========================== */
router.post("/", createTimeSlot);

/* ===========================
   READ
=========================== */
router.get("/", getAllSlots);
router.get("/:id", getSlotById);
router.get("/day/:day", getSlotsByDay);

/* ===========================
   UPDATE
=========================== */
router.put("/time/:id", updateSlotTime);
router.put("/order/:id", updateSlotOrder);
router.put("/break/:id", updateSlotBreak);
router.put("/status/:id", updateSlotStatus);
router.put("/:id", updateTimeSlot); // generic update

/* ===========================
   DELETE (SOFT)
=========================== */
router.delete("/:id", deleteSlot);

export default router;
