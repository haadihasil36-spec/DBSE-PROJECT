import { Router } from "express";
import { analytics, dashboard, progress } from "../controllers/insightController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", requireAuth, dashboard);
router.get("/analytics", requireAuth, analytics);
router.get("/progress", requireAuth, progress);

export default router;