import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  requestAccess,
  listRequests,
  approve,
  reject
} from "../controllers/accessRequests.controller";

const router = Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many requests, please try again later."
});

// Public: submit access request to an existing organization
router.post("/", publicLimiter, requestAccess);

// ADMIN+: list, approve, reject access requests for their org
router.get("/", authenticate, authorize("ADMIN"), listRequests);
router.patch("/:id/approve", authenticate, authorize("ADMIN"), approve);
router.patch("/:id/reject", authenticate, authorize("ADMIN"), reject);

export default router;
