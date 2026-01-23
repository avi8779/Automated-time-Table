import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as roomModel from "../model/room.model.js";

export const createRoom = asyncHandler(async (req, res) => {
  const { room_code, building_id, capacity, room_type } = req.body;

  if (!room_code || !building_id || !capacity || !room_type) {
    throw new AppError("All fields are required", 400);
  }

  if (capacity < 1 || capacity > 300) {
    throw new AppError("Invalid room capacity", 400);
  }

  if (!["CLASSROOM", "LAB"].includes(room_type)) {
    throw new AppError("Invalid room type", 400);
  }

  if (await roomModel.roomCodeExists(room_code)) {
    throw new AppError("Room code already exists", 409);
  }

  if (!(await roomModel.buildingExistsById(building_id))) {
    throw new AppError("Building not found", 404);
  }

  const roomId = await roomModel.createRoom(req.body);

  res.status(201).json({
    success: true,
    message: "Room created successfully",
    room_id: roomId
  });
});

export const getAllRooms = asyncHandler(async (_req, res) => {
  const rooms = await roomModel.getAllRooms();

  res.json({
    success: true,
    count: rooms.length,
    data: rooms
  });
});
