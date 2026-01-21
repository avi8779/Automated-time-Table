import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as tsModel from "../model/teacherSubject.model.js";

/* assign subject to teacher */
export const assignSubjectToTeacher = asyncHandler(async (req, res) => {
  const { teacher_id, subject_id } = req.body;

  if (!teacher_id || !subject_id) {
    throw new AppError("teacher_id and subject_id are required", 400);
  }

  if (!(await tsModel.teacherExistsById(teacher_id))) {
    throw new AppError("Teacher not found", 404);
  }

  if (!(await tsModel.subjectExistsById(subject_id))) {
    throw new AppError("Subject not found", 404);
  }

  if (await tsModel.mappingExists(teacher_id, subject_id)) {
    throw new AppError("Teacher already assigned to this subject", 409);
  }

  const id = await tsModel.createMapping(teacher_id, subject_id);

  res.status(201).json({
    success: true,
    message: "Subject assigned to teacher",
    mapping_id: id
  });
});

/* get subjects by teacher */
export const getSubjectsByTeacher = asyncHandler(async (req, res) => {
  const { teacher_id } = req.params;

  const subjects = await tsModel.getSubjectsByTeacher(teacher_id);

  res.json({
    success: true,
    count: subjects.length,
    data: subjects
  });
});

/* get teachers by subject */
export const getTeachersBySubject = asyncHandler(async (req, res) => {
  const { subject_id } = req.params;

  const teachers = await tsModel.getTeachersBySubject(subject_id);

  res.json({
    success: true,
    count: teachers.length,
    data: teachers
  });
});

/* remove mapping */
export const removeTeacherSubject = asyncHandler(async (req, res) => {
  const { teacher_id, subject_id } = req.params;

  const removed = await tsModel.softDeleteMapping(teacher_id, subject_id);

  if (removed === 0) {
    throw new AppError("Mapping not found or already removed", 404);
  }

  res.json({
    success: true,
    message: "Teacher-subject mapping removed"
  });
});
