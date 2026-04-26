import { Router } from "express";
import {
  createBuilding,
  getAllBuildings,
  getBuildingById,
  getAvailableRoomSlots,
  getRoomSlotsByBuilding,
  updateBuilding,
  deleteBuilding,
} from "../Controller/building.controller.js";

const router = Router();

router.get("/",                     getAllBuildings);
router.post("/",                    createBuilding);
router.get("/:id",                  getBuildingById);
router.put("/:id",                  updateBuilding);
router.delete("/:id",               deleteBuilding);
router.get("/:id/room-slots",       getAvailableRoomSlots);
router.get("/:id/floors",           getRoomSlotsByBuilding);

export default router;