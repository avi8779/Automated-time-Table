import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as subjectModel from "../model/subject.model.js";

/* create */
export const createSubject = asyncHandler(async (req, res) => {
  const {
    subject_code,
    name,
    course_id,
    depart_id,
    weekly_hours,
    is_lab = 0
  } = req.body;

  if (!subject_code || !name || !course_id || !depart_id || !weekly_hours) {
    throw new AppError("All required fields must be provided", 400);
  }

  if (weekly_hours < 1 || weekly_hours > 10) {
    throw new AppError("weekly_hours must be between 1 and 10", 400);
  }

  if (await subjectModel.subjectCodeExists(subject_code)) {
    throw new AppError("Subject code already exists", 409);
  }

  if (!(await subjectModel.courseExistsById(course_id))) {
    throw new AppError("Course not found", 404);
  }

  if (!(await subjectModel.departmentExistsById(depart_id))) {
    throw new AppError("Department not found", 404);
  }

  const subjectId = await subjectModel.createSubject(req.body);

  res.status(201).json({
    success: true,
    message: "Subject created successfully",
    subject_id: subjectId
  });
});

/* get all */
export const getAllSubjects = asyncHandler(async (_req, res) => {
  const subjects = await subjectModel.getAllSubjects();

  res.json({
    success: true,
    count: subjects.length,
    data: subjects
  });
});

/* get one */
export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await subjectModel.getSubjectById(req.params.id);

  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  res.json({
    success: true,
    data: subject
  });
});

/* update */
export const updateSubject = asyncHandler(async (req, res) => {
  const updated = await subjectModel.updateSubject(req.params.id, req.body);

  if (updated === 0) {
    throw new AppError("Subject not found or update failed", 404);
  }

  res.json({
    success: true,
    message: "Subject updated successfully"
  });
});

/* delete */
export const deleteSubject = asyncHandler(async (req, res) => {
  const deleted = await subjectModel.softDeleteSubject(req.params.id);

  if (deleted === 0) {
    throw new AppError("Subject not found or already deleted", 404);
  }

  res.json({
    success: true,
    message: "Subject deleted successfully"
  });
});
