import { Router } from "express";
import {
  createRoom,
  getAllRooms
} from "../Controller/room.controller.js";

const router = Router();

router.post("/", createRoom);
router.get("/", getAllRooms);

export default router;
