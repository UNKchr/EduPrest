import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  requestOrg,
  listRequests,
  approve,
  reject
} from "../controllers/orgRequests.controller";

const router = Router();

const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many requests, please try again later."
});

// Public: submit a new organization registration request
router.post("/", publicLimiter, requestOrg);

// SUPER_ADMIN only: list, approve, reject org requests
router.get("/", authenticate, authorize("SUPER_ADMIN"), listRequests);
router.patch("/:id/approve", authenticate, authorize("SUPER_ADMIN"), approve);
router.patch("/:id/reject", authenticate, authorize("SUPER_ADMIN"), reject);

export default router;
