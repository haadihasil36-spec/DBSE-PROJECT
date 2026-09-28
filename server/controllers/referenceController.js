import { listCategories, listLocations } from "../services/referenceService.js";

export async function categories(_request, response, next) {
  try {
    response.json({ data: await listCategories() });
  } catch (error) {
    next(error);
  }
}

export async function locations(request, response, next) {
  try {
    response.json({ data: await listLocations(request.user.userId) });
  } catch (error) {
    next(error);
  }
}