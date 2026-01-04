import * as departmentModel from "../model/department.model.js";
import asyncHandler from "../middleware/asyncHandler.middleware.js";
import AppError from "../utils/appError.js";

/* ===================== CREATE ===================== */
export const createDepartment = asyncHandler(async (req, res) => {
  const { department_code, name } = req.body;
  
  if (!department_code || !name) {
    throw new AppError("All fields are required", 400);
  }

  const exists = await departmentModel.departmentExists(department_code);
  if (exists) {
    throw new AppError("Department code already exists", 409);
  }

  const departmentId = await departmentModel.createDepartment(req.body);

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    department_id: departmentId
  });
});

/* ===================== UPDATE ===================== */
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { department_code, name } = req.body;
  //console.log("departmetn: ", req.body);
  
  if (!department_code || !name) {
    throw new AppError("All fields are required", 400);
  }

  const exists = await departmentModel.departmentExists(department_code);
  if (exists) {
    throw new AppError("Department code already exists", 409);
  }

  const updated = await departmentModel.updateDepartment(id, req.body);

  if (updated === 0) {
    throw new AppError("Department not found", 404);
  }

  res.json({
    success: true,
    message: "Department updated successfully"
  });
});

/* ===================== GET ALL ===================== */
export const getAllDepartments = asyncHandler(async (_req, res) => {
  const departments = await departmentModel.getAllDepartments();

  res.json({
    success: true,
    count: departments.length,
    data: departments
  });
});

/* ===================== GET BY ID ===================== */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const department = await departmentModel.getDepartmentById(id);

  if (!department) {
    throw new AppError("Department not found", 404);
  }

  res.json({
    success: true,
    data: department
  });
});

/* ===================== DELETE ===================== */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await departmentModel.deleteDepartment(id);

  if (deleted === 0) {
    throw new AppError("Department does not exist", 404);
  }

  res.json({
    success: true,
    message: "Department marked as deleted successfully"
  });
});

