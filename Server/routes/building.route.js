import { Router } from "express";
import {
  createBuilding,
  getAllBuildings
} from "../Controller/building.controller.js";

const router = Router();

router.post("/", createBuilding);
router.get("/", getAllBuildings);

export default router;
