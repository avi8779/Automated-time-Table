import { Router } from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import {
  getRecipients,
  sendCredentials,
  resetPassword,
  changePassword,
} from "../Controller/notify.controller.js";

const router = Router();

router.use(protect);

// Admin only
router.get("/recipients",     restrictTo("admin"), getRecipients);
router.post("/send",          restrictTo("admin"), sendCredentials);
router.post("/reset-password",restrictTo("admin"), resetPassword);

// Any logged-in user (change own password)
router.put("/change-password", changePassword);

export default router;