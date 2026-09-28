import { Router } from "express";
import {
  create,
  createProgress,
  list,
  listProgress,
  remove,
  removeProgress,
  update,
  updateProgress,
} from "../controllers/goalController.js";

const router = Router();

router.get("/", list);
router.post("/", create);
router.get("/:id/progress", listProgress);
router.post("/:id/progress", createProgress);
router.put("/:id/progress/:date", updateProgress);
router.delete("/:id/progress/:date", removeProgress);
router.put("/:id", update);
router.delete("/:id", remove);

export default router;