import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  createItemHandler,
  deleteItemHandler,
  getItem,
  getItems,
  updateItemHandler
} from "../controllers/items.controllers";

const router = Router();

router.get("/", authenticate, authorize("TECH", "ADMIN"), getItems);
router.get("/:id", authenticate, authorize("TECH", "ADMIN"), getItem);
router.post("/", authenticate, authorize("TECH", "ADMIN"), createItemHandler);
router.put("/:id", authenticate, authorize("TECH", "ADMIN"), updateItemHandler);
router.delete("/:id", authenticate, authorize("TECH", "ADMIN"), deleteItemHandler);

export default router;