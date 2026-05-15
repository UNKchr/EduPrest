import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  getAdminSummaryHandler,
  getAnalyticsHandler,
  getDashboard,
  getSummary
} from "../controllers/reports.controller";

const router = Router();

router.get("/summary", authenticate, authorize("ADMIN"), getSummary);
router.get("/dashboard", authenticate, authorize("STUDENT"), getDashboard);
router.get("/admin-summary", authenticate, authorize("ADMIN"), getAdminSummaryHandler);
router.get("/analytics", authenticate, authorize("ADMIN"), getAnalyticsHandler);

export default router;