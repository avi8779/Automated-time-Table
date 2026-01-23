import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as sectionModel from "../model/section.model.js";

/* create */
export const createSection = asyncHandler(async (req, res) => {
  const { section_code, name, course_id, year, strength } = req.body;

  if (!section_code || !name || !course_id || !year || !strength) {
    throw new AppError("All fields are required", 400);
  }

  if (year < 1 || year > 5) {
    throw new AppError("Invalid academic year", 400);
  }

  if (strength < 1 || strength > 200) {
    throw new AppError("Invalid section strength", 400);
  }

  if (await sectionModel.sectionCodeExists(section_code)) {
    throw new AppError("Section code already exists", 409);
  }

  if (!(await sectionModel.courseExistsById(course_id))) {
    throw new AppError("Course not found", 404);
  }

  const sectionId = await sectionModel.createSection(req.body);

  res.status(201).json({
    success: true,
    message: "Section created successfully",
    section_id: sectionId
  });
});

/* get all */
export const getAllSections = asyncHandler(async (_req, res) => {
  const sections = await sectionModel.getAllSections();

  res.json({
    success: true,
    count: sections.length,
    data: sections
  });
});

/* get one */
export const getSectionById = asyncHandler(async (req, res) => {
  const section = await sectionModel.getSectionById(req.params.id);

  if (!section) {
    throw new AppError("Section not found", 404);
  }

  res.json({
    success: true,
    data: section
  });
});

/* update */
export const updateSection = asyncHandler(async (req, res) => {
  const updated = await sectionModel.updateSection(req.params.id, req.body);

  if (updated === 0) {
    throw new AppError("Section not found or update failed", 404);
  }

  res.json({
    success: true,
    message: "Section updated successfully"
  });
});

/* delete */
export const deleteSection = asyncHandler(async (req, res) => {
  const deleted = await sectionModel.softDeleteSection(req.params.id);

  if (deleted === 0) {
    throw new AppError("Section not found or already deleted", 404);
  }

  res.json({
    success: true,
    message: "Section deleted successfully"
  });
});
