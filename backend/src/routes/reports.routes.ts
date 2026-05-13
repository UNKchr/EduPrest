import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { getAdminSummaryHandler, getDashboard, getSummary } from "../controllers/reports.controller";

const router = Router();

router.get("/summary", authenticate, authorize("ADMIN"), getSummary);
router.get("/dashboard", authenticate, authorize("STUDENT"), getDashboard);
router.get("/admin-summary", authenticate, authorize("ADMIN"), getAdminSummaryHandler);

export default router;