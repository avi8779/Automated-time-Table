import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as buildingModel from "../model/building.model.js";

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createBuilding = asyncHandler(async (req, res) => {
  const { building_code, building_name, floors, status } = req.body;

  if (!building_code || !building_name || !floors || !status) {
    throw new AppError("All fields are required", 400);
  }

  if (!["ACTIVE", "INACTIVE"].includes(status.toUpperCase())) {
    throw new AppError("Status must be ACTIVE or INACTIVE", 400);
  }

  if (await buildingModel.buildingCodeExists(building_code)) {
    throw new AppError("Building code already exists", 409);
  }

  const buildingId = await buildingModel.createBuilding({
    building_code,
    building_name,
    floors: Number(floors),
    status: status.toUpperCase(),
  });

  res.status(201).json({
    success: true,
    message: "Building created successfully",
    building_id: buildingId,
  });
});

// ── READ ALL ──────────────────────────────────────────────────────────────────

export const getAllBuildings = asyncHandler(async (_req, res) => {
  const buildings = await buildingModel.getAllBuildings();

  res.json({
    success: true,
    count: buildings.length,
    data: buildings,
  });
});

// ── READ ONE ──────────────────────────────────────────────────────────────────

export const getBuildingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const building = await buildingModel.getBuildingById(id);

  if (!building) {
    throw new AppError("Building not found", 404);
  }

  res.json({
    success: true,
    data: building,
  });
});

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateBuilding = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { building_code, building_name, floors, status } = req.body;

  if (!building_code || !building_name || !floors || !status) {
    throw new AppError("All fields are required", 400);
  }

  if (!["ACTIVE", "INACTIVE"].includes(status.toUpperCase())) {
    throw new AppError("Status must be ACTIVE or INACTIVE", 400);
  }

  if (!(await buildingModel.buildingExistsById(id))) {
    throw new AppError("Building not found", 404);
  }

  const updated = await buildingModel.updateBuilding(id, {
    building_code,
    building_name,
    floors: Number(floors),
    status: status.toUpperCase(),
  });

  if (updated === 0) {
    throw new AppError("Building update failed", 400);
  }

  res.json({
    success: true,
    message: "Building updated successfully",
  });
});

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

export const deleteBuilding = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await buildingModel.softDeleteBuilding(id);

  if (deleted === 0) {
    throw new AppError("Building not found or already deleted", 404);
  }

  res.json({
    success: true,
    message: "Building deleted successfully",
  });
});