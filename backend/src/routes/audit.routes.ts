import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { getAuditLogs } from "../controllers/audit.controller";

const router = Router();

router.get("/", authenticate, authorize("TECH", "ADMIN"), getAuditLogs);

export default router;