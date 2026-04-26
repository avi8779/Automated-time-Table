import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as buildingModel from "../model/building.model.js";

export const createBuilding = asyncHandler(async (req, res) => {
  const { building_code, building_name, floors, rooms_per_floor, status } = req.body;

  if (!building_code || !building_name || !floors || !rooms_per_floor || !status)
    throw new AppError("All fields are required", 400);

  if (await buildingModel.buildingCodeExists(building_code))
    throw new AppError("Building code already exists", 409);

  const building_id = await buildingModel.createBuilding({
    building_code, building_name,
    floors:          Number(floors),
    rooms_per_floor: Number(rooms_per_floor),
    status:          status.toUpperCase(),
  });

  res.status(201).json({
    success: true,
    message: `Building created with ${floors * rooms_per_floor} room slots`,
    building_id,
  });
});

export const getAllBuildings = asyncHandler(async (_req, res) => {
  const buildings = await buildingModel.getAllBuildings();
  res.json({ success: true, count: buildings.length, data: buildings });
});

export const getBuildingById = asyncHandler(async (req, res) => {
  const building = await buildingModel.getBuildingById(req.params.id);
  if (!building) throw new AppError("Building not found", 404);
  res.json({ success: true, data: building });
});

/* GET /api/v1/buildings/:id/room-slots — unassigned slots for room dropdown */
export const getAvailableRoomSlots = asyncHandler(async (req, res) => {
  const slots = await buildingModel.getAvailableRoomSlots(req.params.id);
  res.json({ success: true, data: slots });
});

/* GET /api/v1/buildings/:id/floors — all slots grouped by floor */
export const getRoomSlotsByBuilding = asyncHandler(async (req, res) => {
  const slots = await buildingModel.getRoomSlotsByBuilding(req.params.id);

  // Group by floor
  const floors = {};
  slots.forEach((s) => {
    if (!floors[s.floor_no]) floors[s.floor_no] = [];
    floors[s.floor_no].push(s);
  });

  res.json({ success: true, data: floors });
});

export const updateBuilding = asyncHandler(async (req, res) => {
  const { building_code, building_name, floors, rooms_per_floor, status } = req.body;
  if (!building_code || !building_name || !floors || !rooms_per_floor || !status)
    throw new AppError("All fields are required", 400);

  if (!(await buildingModel.buildingExistsById(req.params.id)))
    throw new AppError("Building not found", 404);

  await buildingModel.updateBuilding(req.params.id, {
    building_code, building_name,
    floors:          Number(floors),
    rooms_per_floor: Number(rooms_per_floor),
    status:          status.toUpperCase(),
  });

  res.json({ success: true, message: "Building updated successfully" });
});

export const deleteBuilding = asyncHandler(async (req, res) => {
  const deleted = await buildingModel.softDeleteBuilding(req.params.id);
  if (deleted === 0) throw new AppError("Building not found or already deleted", 404);
  res.json({ success: true, message: "Building deleted successfully" });
});