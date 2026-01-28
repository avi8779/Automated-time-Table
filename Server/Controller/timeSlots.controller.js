import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as slotModel from "../model/timeSlots.model.js";

export const createTimeSlot = asyncHandler(async (req, res) => {
  const { day, slot_order, start_time, end_time, slot_type = "CLASS" } = req.body;

  if (!day || !slot_order || !start_time || !end_time) {
    throw new AppError("All fields are required", 400);
  }

  if (!["MON","TUE","WED","THU","FRI","SAT"].includes(day)) {
    throw new AppError("Invalid day", 400);
  }

  if (await slotModel.slotExists(day, slot_order)) {
    throw new AppError("Slot already exists for this day and order", 409);
  }

  const slotId = await slotModel.createTimeSlot(req.body);

  res.status(201).json({
    success: true,
    message: "Time slot created",
    slot_id: slotId
  });
});

export const getAllSlots = asyncHandler(async (_req, res) => {
  const slots = await slotModel.getAllSlots();

  res.json({
    success: true,
    count: slots.length,
    data: slots
  });
});

export const getSlotsByDay = asyncHandler(async (req, res) => {
  const { day } = req.params;

  const slots = await slotModel.getSlotsByDay(day);

  res.json({
    success: true,
    count: slots.length,
    data: slots
  });
});
