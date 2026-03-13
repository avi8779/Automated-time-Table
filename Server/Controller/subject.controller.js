import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as subjectModel from "../model/subject.model.js";

const VALID_SLOTS  = ["ANY", "MORNING", "AFTERNOON"];
const VALID_STATUS = ["ACTIVE", "INACTIVE"];

// ── CREATE ────────────────────────────────────────────────────────────────────

export const createSubject = asyncHandler(async (req, res) => {
  const {
    subject_code,
    subject_name,
    course_id,
    semester,
    weekly_hours,
    credits,
    is_lab = 0,
    preferred_slot = "ANY",
    status = "ACTIVE",
  } = req.body;

  if (!subject_code || !subject_name || !course_id || !semester || !weekly_hours || !credits) {
    throw new AppError("All required fields must be provided", 400);
  }

  if (weekly_hours < 1 || weekly_hours > 10) {
    throw new AppError("weekly_hours must be between 1 and 10", 400);
  }

  if (!VALID_SLOTS.includes(preferred_slot.toUpperCase())) {
    throw new AppError("preferred_slot must be ANY, MORNING or AFTERNOON", 400);
  }

  if (!VALID_STATUS.includes(status.toUpperCase())) {
    throw new AppError("status must be ACTIVE or INACTIVE", 400);
  }

  if (await subjectModel.subjectCodeExists(subject_code)) {
    throw new AppError("Subject code already exists", 409);
  }

  if (!(await subjectModel.courseExistsById(course_id))) {
    throw new AppError("Course not found", 404);
  }

  const subjectId = await subjectModel.createSubject({
    subject_code,
    subject_name,
    course_id:      Number(course_id),
    semester:       Number(semester),
    weekly_hours:   Number(weekly_hours),
    credits:        Number(credits),
    is_lab:         Number(is_lab),
    preferred_slot: preferred_slot.toUpperCase(),
    status:         status.toUpperCase(),
  });

  res.status(201).json({
    success: true,
    message: "Subject created successfully",
    subject_id: subjectId,
  });
});

// ── READ ALL ──────────────────────────────────────────────────────────────────

export const getAllSubjects = asyncHandler(async (_req, res) => {
  const subjects = await subjectModel.getAllSubjects();

  res.json({
    success: true,
    count: subjects.length,
    data: subjects,
  });
});

// ── READ ONE ──────────────────────────────────────────────────────────────────

export const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await subjectModel.getSubjectById(req.params.id);

  if (!subject) {
    throw new AppError("Subject not found", 404);
  }

  res.json({
    success: true,
    data: subject,
  });
});

// ── UPDATE ────────────────────────────────────────────────────────────────────

export const updateSubject = asyncHandler(async (req, res) => {
  const {
    subject_code,
    subject_name,
    course_id,
    semester,
    weekly_hours,
    credits,
    is_lab,
    preferred_slot,
    status,
  } = req.body;

  if (!subject_code || !subject_name || !course_id || !semester || !weekly_hours || !credits) {
    throw new AppError("All required fields must be provided", 400);
  }

  if (weekly_hours < 1 || weekly_hours > 10) {
    throw new AppError("weekly_hours must be between 1 and 10", 400);
  }

  if (!(await subjectModel.subjectExistsById(req.params.id))) {
    throw new AppError("Subject not found", 404);
  }

  if (!(await subjectModel.courseExistsById(course_id))) {
    throw new AppError("Course not found", 404);
  }

  const updated = await subjectModel.updateSubject(req.params.id, {
    subject_code,
    subject_name,
    course_id:      Number(course_id),
    semester:       Number(semester),
    weekly_hours:   Number(weekly_hours),
    credits:        Number(credits),
    is_lab:         Number(is_lab) || 0,
    preferred_slot: preferred_slot?.toUpperCase() || "ANY",
    status:         status?.toUpperCase() || "ACTIVE",
  });

  if (updated === 0) {
    throw new AppError("Subject not found or update failed", 404);
  }

  res.json({
    success: true,
    message: "Subject updated successfully",
  });
});

// ── DELETE (soft) ─────────────────────────────────────────────────────────────

export const deleteSubject = asyncHandler(async (req, res) => {
  const deleted = await subjectModel.softDeleteSubject(req.params.id);

  if (deleted === 0) {
    throw new AppError("Subject not found or already deleted", 404);
  }

  res.json({
    success: true,
    message: "Subject deleted successfully",
  });
});