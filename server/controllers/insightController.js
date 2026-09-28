import { getAnalytics, getDashboard, getProgress } from "../services/insightService.js";

function respond(work) {
  return async (request, response, next) => {
    try {
      response.json(await work(request));
    } catch (error) {
      next(error);
    }
  };
}

export const dashboard = respond((request) => getDashboard(request.user.userId));
export const analytics = respond((request) => getAnalytics(request.user.userId, request.query));
export const progress = respond((request) => getProgress(request.user.userId, request.query));