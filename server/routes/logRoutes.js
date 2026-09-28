import { Router } from "express";
import { createLogHandlers } from "../controllers/logController.js";

export function createLogRouter(resource) {
  const router = Router();
  const handlers = createLogHandlers(resource);
  router.get("/", handlers.list);
  router.post("/", handlers.create);
  router.get("/:id", handlers.get);
  router.put("/:id", handlers.update);
  router.delete("/:id", handlers.delete);
  return router;
}