import { Router } from "express";
import {
    createDepartment,
    updateDepartment,
    getAllDepartments,
    getDepartmentById,
    deleteDepartment
 } from "../Controller/department.controller.js";

const router = Router();

/* CREATE */
router.post("/", createDepartment);

/* READ */
router.get("/", getAllDepartments);
router.get("/:id", getDepartmentById);

/* UPDATE */
router.put("/:id", updateDepartment);

/* DELETE */
router.delete("/:id", deleteDepartment);

export default router;
