import { getDailyLog, updateDailyLog } from "../services/dailyLogService.js";

export async function get(request, response, next) {
  try {
    response.json({ data: await getDailyLog(request.user.userId, request.params.date) });
  } catch (error) {
    next(error);
  }
}

export async function update(request, response, next) {
  try {
    response.json({ data: await updateDailyLog(request.user.userId, request.params.date, request.body) });
  } catch (error) {
    next(error);
  }
}