import { Router } from "express";
import { pool } from "../db/pool.js";

const router = Router();

router.get("/", (_request, response) => {
  response.json({
    status: "ok",
    message: "LifeLog API is running",
  });
});

router.get("/db", async (_request, response, next) => {
  try {
    await pool.query("SELECT 1");
    response.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    error.statusCode = 503;
    error.message = "Database connection unavailable";
    next(error);
  }
});

export default router;
