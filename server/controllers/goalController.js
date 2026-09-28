import {
  createGoal,
  createGoalProgress,
  deleteGoal,
  deleteGoalProgress,
  listGoalProgress,
  listGoals,
  updateGoal,
  updateGoalProgress,
} from "../services/goalService.js";

function action(status, work) {
  return async (request, response, next) => {
    try {
      const data = await work(request);
      if (status === 204) return response.status(204).end();
      response.status(status).json({ data });
    } catch (error) {
      next(error);
    }
  };
}

export const list = action(200, (request) => listGoals(request.user.userId));
export const create = action(201, (request) => createGoal(request.body, request.user.userId));
export const update = action(200, (request) => updateGoal(request.params.id, request.body, request.user.userId));
export const remove = action(204, (request) => deleteGoal(request.params.id, request.user.userId));
export const listProgress = action(200, (request) => listGoalProgress(request.params.id, request.user.userId));
export const createProgress = action(201, (request) => createGoalProgress(request.params.id, request.body, request.user.userId));
export const updateProgress = action(200, (request) => updateGoalProgress(
  request.params.id, request.params.date, request.body, request.user.userId,
));
export const removeProgress = action(204, (request) => deleteGoalProgress(
  request.params.id, request.params.date, request.user.userId,
));