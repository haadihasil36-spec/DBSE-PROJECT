import { Router } from "express";
import { categories, locations } from "../controllers/referenceController.js";
import { requireAuth } from "../middleware/auth.js";

const categoriesRouter = Router();
const locationsRouter = Router();

categoriesRouter.get("/", categories);
locationsRouter.get("/", requireAuth, locations);

export { categoriesRouter, locationsRouter };