import { Router } from "express";
import { authenticate } from "../middlewares/auth";
import { authorize } from "../middlewares/authorize";
import {
  createItemHandler,
  deleteItemHandler,
  getItem,
  getItems,
  updateItemHandler
} from "../controllers/items.controller";

const router = Router();

router.get("/", authenticate, authorize("TECH"), getItems);
router.get("/:id", authenticate, authorize("TECH"), getItem);
router.post("/", authenticate, authorize("TECH"), createItemHandler);
router.put("/:id", authenticate, authorize("TECH"), updateItemHandler);
router.delete("/:id", authenticate, authorize("TECH"), deleteItemHandler);

export default router;