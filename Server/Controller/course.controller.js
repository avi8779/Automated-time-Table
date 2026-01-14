import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";
import * as courseModel from "../model/course.model.js";

export const createCourse = asyncHandler(async (req, res) => {
  const { course_code, course_name, depart_id, duration_years } = req.body;

  // ✅ Validation
  if (!course_code || !course_name || !depart_id || !duration_years) {
    throw new AppError("All fields are required", 400);
  }

  // ✅ Foreign key check
  const deptExists = await courseModel.departmentExistsById(depart_id);
  if (!deptExists) {
    throw new AppError("Department not found", 404);
  }

//   const courseExist = await courseModel.courseExistsById(courseId);
//   if(courseExist) {
//     throw new AppError("Course Code already Exists", 409);
//   }

  // ✅ Insert
  const courseId = await courseModel.createCourse(req.body);

  res.status(201).json({
    success: true,
    message: "Course created successfully",
    course_id: courseId
  });
});


export const updateCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { course_code, course_name, depart_id, duration_years } = req.body;

  // 1️⃣ Validation
  if (!course_code || !course_name || !depart_id || !duration_years) {
    throw new AppError("All fields are required", 400);
  }

  // 2️⃣ Course exists?
  const courseExists = await courseModel.courseExistsById(id);
  if (!courseExists) {
    throw new AppError("Course not found", 404);
  }

  // 3️⃣ Department exists?
  const deptExists = await courseModel.departmentExistsById(depart_id);
  if (!deptExists) {
    throw new AppError("Department not found", 404);
  }

  // 4️⃣ Update
  const updated = await courseModel.updateCourse(id, req.body);

  if (updated === 0) {
    throw new AppError("Course update failed", 400);
  }

  res.json({
    success: true,
    message: "Course updated successfully"
  });
});


export const getAllCourses = asyncHandler(async (_req, res) => {
  const courses = await courseModel.getAllCourses();

  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});


export const getCourseById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const course = await courseModel.getCourseById(id);

  if (!course) {
    throw new AppError("Course not found", 404);
  }

  res.json({
    success: true,
    data: course
  });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await courseModel.softDeleteCourse(id);

  if (deleted === 0) {
    throw new AppError("Course not found or already deleted", 404);
  }

  res.json({
    success: true,
    message: "Course deleted successfully"
  });
});

export const restoreCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const restored = await courseModel.restoreCourse(id);

  if (restored === 0) {
    throw new AppError("Course not found or already active", 404);
  }

  res.json({
    success: true,
    message: "Course restored successfully"
  });
});


export const getDeletedCourses = asyncHandler(async (_req, res) => {
  const courses = await courseModel.getDeletedCourses();

  res.json({
    success: true,
    count: courses.length,
    data: courses
  });
});






