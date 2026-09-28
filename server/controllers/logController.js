import {
  createLog,
  deleteLog,
  getLog,
  listLogs,
  updateLog,
} from "../services/logService.js";
import { validateDate } from "../validators/coreValidators.js";

function handle(work) {
  return async (request, response, next) => {
    try {
      const result = await work(request);
      if (result === undefined) return response.status(204).end();
      response.json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}

export function createLogHandlers(resource) {
  return {
    list: handle((request) => listLogs(
      resource,
      request.user.userId,
      request.query.date === undefined ? undefined : validateDate(request.query.date),
    )),
    get: handle((request) => getLog(resource, request.params.id, request.user.userId)),
    create: async (request, response, next) => {
      try {
        const data = await createLog(resource, request.body, request.user.userId);
        response.status(201).json({ data });
      } catch (error) {
        next(error);
      }
    },
    update: handle((request) => updateLog(resource, request.params.id, request.body, request.user.userId)),
    delete: handle((request) => deleteLog(resource, request.params.id, request.user.userId)),
  };
}