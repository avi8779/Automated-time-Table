import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as teacherModel from "../model/teacher.model.js";

/* create teacher */
export const createTeacher = asyncHandler(async (req, res) => {
  const {
    teacher_code,
    name,
    email,
    depart_id,
    max_hours_per_day = 4,
    max_hours_per_week = 20
  } = req.body;

  // 1️⃣ Required fields
  if (!teacher_code || !name || !email || !depart_id) {
    throw new AppError("All required fields must be provided", 400);
  }

  // 2️⃣ Business validations
  if (max_hours_per_day < 1 || max_hours_per_day > 6) {
    throw new AppError("max_hours_per_day must be between 1 and 6", 400);
  }

  if (max_hours_per_week < 1 || max_hours_per_week > 30) {
    throw new AppError("max_hours_per_week must be between 1 and 30", 400);
  }

  if (max_hours_per_day > max_hours_per_week) {
    throw new AppError(
      "Daily hours cannot be greater than weekly hours",
      400
    );
  }

  // 3️⃣ Uniqueness
  const exists = await teacherModel.teacherExistsByCode(teacher_code);
  if (exists) {
    throw new AppError("Teacher code already exists", 409);
  }

  // 4️⃣ FK check
  const deptExists = await teacherModel.departmentExistsById(depart_id);
  if (!deptExists) {
    throw new AppError("Department not found", 404);
  }

  // 5️⃣ Create
  const teacherId = await teacherModel.createTeacher({
    teacher_code,
    name,
    email,
    depart_id,
    max_hours_per_day,
    max_hours_per_week
  });

  res.status(201).json({
    success: true,
    message: "Teacher created successfully",
    teacher_id: teacherId
  });
});


/* get all teachers */
export const getAllTeachers = asyncHandler(async (_req, res) => {
  const teachers = await teacherModel.getAllTeachers();

  res.json({
    success: true,
    count: teachers.length,
    data: teachers
  });
});

export const updateTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    teacher_code,
    name,
    email,
    depart_id,
    max_hours_per_day = 4,
    max_hours_per_week = 20
  } = req.body;

  if (!teacher_code || !name || !email || !depart_id) {
    throw new AppError("All required fields must be provided", 400);
  }

  if (max_hours_per_day < 1 || max_hours_per_day > 6) {
    throw new AppError("max_hours_per_day must be between 1 and 6", 400);
  }

  if (max_hours_per_week < 1 || max_hours_per_week > 30) {
    throw new AppError("max_hours_per_week must be between 1 and 30", 400);
  }

  if (max_hours_per_day > max_hours_per_week) {
    throw new AppError("Daily hours cannot exceed weekly hours", 400);
  }

  const exists = await teacherModel.teacherExistsById(id);
  if (!exists) {
    throw new AppError("Teacher not found", 404);
  }

  const deptExists = await teacherModel.departmentExistsById(depart_id);
  if (!deptExists) {
    throw new AppError("Department not found", 404);
  }

  const updated = await teacherModel.updateTeacher(id, req.body);

  if (updated === 0) {
    throw new AppError("Teacher update failed", 400);
  }

  res.json({
    success: true,
    message: "Teacher updated successfully"
  });
});


export const deleteTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await teacherModel.softDeleteTeacher(id);

  if (deleted === 0) {
    throw new AppError("Teacher not found or already deleted", 404);
  }

  res.json({
    success: true,
    message: "Teacher deleted successfully"
  });
});

export const restoreTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const restored = await teacherModel.restoreTeacher(id);

  if (restored === 0) {
    throw new AppError("Teacher not found or already active", 404);
  }

  res.json({
    success: true,
    message: "Teacher restored successfully"
  });
});


export const getTeacherById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const teacher = await teacherModel.getTeacherById(id);

  if (!teacher) {
    throw new AppError("Teacher not found", 404);
  }

  res.json({
    success: true,
    data: teacher
  });
});


