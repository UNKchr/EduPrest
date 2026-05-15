import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  getUsers,
  createUserHandler,
  updateRoleHandler,
  banUserHandler,
  unbanUserHandler,
  deleteUserHandler
} from "../controllers/users.controller";

const router = Router();

router.get("/", authenticate, authorize("TECH"), getUsers);
router.post("/", authenticate, authorize("ADMIN"), createUserHandler);
router.patch("/:id/role", authenticate, authorize("ADMIN"), updateRoleHandler);
router.patch("/:id/ban", authenticate, authorize("ADMIN"), banUserHandler);
router.patch("/:id/unban", authenticate, authorize("ADMIN"), unbanUserHandler);
router.delete("/:id", authenticate, authorize("ADMIN"), deleteUserHandler);

export default router;