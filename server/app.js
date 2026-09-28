import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/error.js";
import { notFound } from "./middleware/notFound.js";
import authRouter from "./routes/auth.js";
import dailyLogsRouter from "./routes/dailyLogs.js";
import goalsRouter from "./routes/goals.js";
import healthRouter from "./routes/health.js";
import insightsRouter from "./routes/insights.js";
import { createLogRouter } from "./routes/logRoutes.js";
import { categoriesRouter, locationsRouter } from "./routes/references.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/locations", locationsRouter);
app.use("/api/daily-logs", requireAuth, dailyLogsRouter);
app.use("/api/goals", requireAuth, goalsRouter);
app.use("/api", insightsRouter);
for (const resource of [
  "activities", "expenses", "study-sessions", "food-logs", "transport-logs",
  "screen-time", "mood-logs", "sleep-logs",
]) {
  app.use(`/api/${resource}`, requireAuth, createLogRouter(resource));
}

app.use(notFound);
app.use(errorHandler);

export default app;
