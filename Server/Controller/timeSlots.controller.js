import * as TimeSlot from "../model/timeSlots.model.js";

/* ===========================
   CREATE
=========================== */

export const createTimeSlot = async (req, res) => {
  try {
    const slotId = await TimeSlot.createTimeSlot(req.body);

    res.status(201).json({
      success: true,
      message: "Time slot created successfully",
      data: { slot_id: slotId }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* ===========================
   READ
=========================== */

export const getAllSlots = async (req, res) => {
  try {
    const slots = await TimeSlot.getAllSlots();

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSlotsByDay = async (req, res) => {
  try {
    const { day } = req.params;

    const slots = await TimeSlot.getSlotsByDay(day);

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getSlotById = async (req, res) => {
  try {
    const { id } = req.params;

    const slot = await TimeSlot.getSlotById(id);

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found"
      });
    }

    res.json({
      success: true,
      data: slot
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/* ===========================
   UPDATE
=========================== */

export const updateSlotTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_time, end_time } = req.body;

    const updated = await TimeSlot.updateSlotTime(id, start_time, end_time);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found or deleted"
      });
    }

    res.json({
      success: true,
      message: "Slot time updated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateSlotOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, slot_order } = req.body;

    const updated = await TimeSlot.updateSlotOrder(day, id, slot_order);

    res.json({
      success: true,
      message: "Slot order updated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateSlotBreak = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_break } = req.body;

    const updated = await TimeSlot.updateSlotBreak(id, is_break);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found"
      });
    }

    res.json({
      success: true,
      message: "Slot break status updated"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

export const updateSlotStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await TimeSlot.updateSlotStatus(id, status);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found"
      });
    }

    res.json({
      success: true,
      message: "Slot status updated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* ===========================
   GENERIC UPDATE (ADMIN)
=========================== */

export const updateTimeSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await TimeSlot.updateTimeSlot(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found"
      });
    }

    res.json({
      success: true,
      message: "Time slot updated successfully"
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/* ===========================
   DELETE (SOFT)
=========================== */

export const deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await TimeSlot.deleteSlot(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Time slot not found or already deleted"
      });
    }

    res.json({
      success: true,
      message: "Time slot deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
