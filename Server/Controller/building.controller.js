import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as buildingModel from "../model/building.model.js";

export const createBuilding = asyncHandler(async (req, res) => {
  const { building_code, name } = req.body;

  if (!building_code || !name) {
    throw new AppError("All fields are required", 400);
  }

  if (await buildingModel.buildingCodeExists(building_code)) {
    throw new AppError("Building code already exists", 409);
  }

  const buildingId = await buildingModel.createBuilding(req.body);

  res.status(201).json({
    success: true,
    message: "Building created successfully",
    building_id: buildingId
  });
});

export const getAllBuildings = asyncHandler(async (_req, res) => {
  const buildings = await buildingModel.getAllBuildings();

  res.json({
    success: true,
    count: buildings.length,
    data: buildings
  });
});
