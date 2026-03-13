import { Router } from "express";
import {
  createRoom,
  getAllRooms,
  updateRoom,
  deleteRoom,
} from "../Controller/room.controller.js";

const router = Router();

router.post("/", createRoom);
router.get("/", getAllRooms);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;
