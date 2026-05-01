import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  createReportHandler,
  listReportsHandler,
  updateReportHandler
} from "../controllers/userReports.controller";

const router = Router();

router.post("/", authenticate, authorize("TECH"), createReportHandler);
router.get("/", authenticate, authorize("ADMIN"), listReportsHandler);
router.patch("/:id/status", authenticate, authorize("ADMIN"), updateReportHandler);

export default router;