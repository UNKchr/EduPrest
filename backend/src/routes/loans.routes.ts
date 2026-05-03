import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  createLoanHandler,
  getLoan,
  getLoans,
  getMyLoans,
  returnLoanHandler,
  updateLoanStatusHandler
} from "../controllers/loans.controller";

const router = Router();

router.get("/", authenticate, getLoans);
router.get("/my", authenticate, authorize("STUDENT"), getMyLoans);
router.get("/:id", authenticate, authorize("TECH"), getLoan);

router.post("/", authenticate, authorize("TECH"), createLoanHandler);
router.patch("/:id/return", authenticate, authorize("TECH"), returnLoanHandler);
router.patch("/:id/status", authenticate, authorize("TECH"), updateLoanStatusHandler);

export default router;