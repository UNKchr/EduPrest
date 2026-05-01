import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import { banOrg, createOrg, listOrgs, unbanOrg } from "../controllers/organizations.controller";

const router = Router();

router.post("/", authenticate, authorize("SUPER_ADMIN"), createOrg);
router.get("/", authenticate, authorize("SUPER_ADMIN"), listOrgs);
router.patch("/:id/ban", authenticate, authorize("SUPER_ADMIN"), banOrg);
router.patch("/:id/unban", authenticate, authorize("SUPER_ADMIN"), unbanOrg);

export default router;