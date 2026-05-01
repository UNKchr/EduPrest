import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { getSummary } from "../controllers/reports.controller";

const router = Router();

router.get("/summary", authenticate, authorize("ADMIN"), getSummary);

export default router;