import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as roomModel from "../model/room.model.js";
import { markSlotConfigured, markSlotAvailable } from "../model/building.model.js";

const VALID_ROOM_TYPES  = ["CLASSROOM", "LAB"];
const VALID_ROOM_STATUS = ["AVAILABLE", "OCCUPIED", "MAINTENANCE"];

export const createRoom = asyncHandler(async (req, res) => {
  const {
    room_no, building_id, capacity, room_type,
    floor_no, status = "AVAILABLE",
    has_projector = 0, has_ac = 0,
  } = req.body;

  if (!room_no || !building_id || !capacity || !room_type || !floor_no)
    throw new AppError("All required fields must be provided", 400);

  if (!VALID_ROOM_TYPES.includes(room_type.toUpperCase()))
    throw new AppError("room_type must be CLASSROOM or LAB", 400);

  if (!VALID_ROOM_STATUS.includes(status.toUpperCase()))
    throw new AppError("status must be AVAILABLE, OCCUPIED or MAINTENANCE", 400);

  if (capacity < 1 || capacity > 300)
    throw new AppError("Capacity must be between 1 and 300", 400);

  if (await roomModel.roomNoExists(room_no, building_id))
    throw new AppError("Room number already exists", 409);

  if (!(await roomModel.buildingExistsById(building_id)))
    throw new AppError("Building not found", 404);

  const room_id = await roomModel.createRoom({
    room_no, building_id: Number(building_id),
    capacity: Number(capacity), room_type: room_type.toUpperCase(),
    floor_no: Number(floor_no), status: status.toUpperCase(),
    has_projector: Number(has_projector), has_ac: Number(has_ac),
  });

  // Mark the slot as configured
  await markSlotConfigured(Number(building_id), room_no);

  res.status(201).json({ success: true, message: "Room created successfully", room_id });
});

export const getAllRooms = asyncHandler(async (_req, res) => {
  const rooms = await roomModel.getAllRooms();
  res.json({ success: true, count: rooms.length, data: rooms });
});

export const getRoomById = asyncHandler(async (req, res) => {
  const room = await roomModel.getRoomById(req.params.id);
  if (!room) throw new AppError("Room not found", 404);
  res.json({ success: true, data: room });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const {
    room_no, building_id, capacity, room_type,
    floor_no, status, has_projector = 0, has_ac = 0,
  } = req.body;

  if (!room_no || !building_id || !capacity || !room_type || !floor_no || !status)
    throw new AppError("All required fields must be provided", 400);

  if (!VALID_ROOM_TYPES.includes(room_type.toUpperCase()))
    throw new AppError("room_type must be CLASSROOM or LAB", 400);

  if (await roomModel.roomNoExists(room_no, building_id, req.params.id))
    throw new AppError("Room number already exists", 409);

  const updated = await roomModel.updateRoom(req.params.id, {
    room_no, building_id: Number(building_id),
    capacity: Number(capacity), room_type: room_type.toUpperCase(),
    floor_no: Number(floor_no), status: status.toUpperCase(),
    has_projector: Number(has_projector), has_ac: Number(has_ac),
  });

  if (updated === 0) throw new AppError("Room not found", 404);
  res.json({ success: true, message: "Room updated successfully" });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  // Get room info before deleting to free up the slot
  const room = await roomModel.getRoomById(req.params.id);
  if (!room) throw new AppError("Room not found", 404);

  const deleted = await roomModel.softDeleteRoom(req.params.id);
  if (deleted === 0) throw new AppError("Room not found or already deleted", 404);

  // Free up the building slot
  await markSlotAvailable(room.building_id, room.room_no);

  res.json({ success: true, message: "Room deleted successfully" });
});
