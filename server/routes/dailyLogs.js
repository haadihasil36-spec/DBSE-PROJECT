import { Router } from "express";
import { get, update } from "../controllers/dailyLogController.js";

const router = Router();

router.get("/:date", get);
router.put("/:date", update);

export default router;