import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";

const router = Router();

router.get("/admin", authenticate, authorize("ADMIN"), (_req, res) => {
  res.json({ message: "Admin access granted" });
});

router.get("/tech", authenticate, authorize("TECH"), (_req, res) => {
  res.json({ message: "Tech access granted" });
});

router.get("/student", authenticate, authorize("STUDENT"), (_req, res) => {
  res.json({ message: "Student access granted" });
});

export default router;