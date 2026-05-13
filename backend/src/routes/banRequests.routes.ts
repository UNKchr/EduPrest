import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  approveRequestHandler,
  createRequestHandler,
  listRequestsHandler,
  rejectRequestHandler
} from "../controllers/banRequests.controller";

const router = Router();

router.get("/", authenticate, authorize("ADMIN"), listRequestsHandler);
router.post("/", authenticate, authorize("ADMIN"), createRequestHandler);
router.patch("/:id/approve", authenticate, authorize("SUPER_ADMIN"), approveRequestHandler);
router.patch("/:id/reject", authenticate, authorize("SUPER_ADMIN"), rejectRequestHandler);

export default router;
