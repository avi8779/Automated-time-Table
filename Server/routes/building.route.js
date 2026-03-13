import { Router } from "express";
import {
  createBuilding,
  getAllBuildings,
  updateBuilding,
  deleteBuilding,
} from "../Controller/building.controller.js";

const router = Router();

router.post("/", createBuilding);
router.get("/", getAllBuildings);
router.put("/:id", updateBuilding);
router.delete("/:id", deleteBuilding );

export default router;
