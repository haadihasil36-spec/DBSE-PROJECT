import { pool } from "../db/pool.js";
import { getOrCreateDailyLog } from "../db/lifeLogQueries.js";
import { validationError, validateDate } from "../validators/coreValidators.js";

const relatedTables = {
  activities: "activities",
  expenses: "expenses",
  study_sessions: "study_sessions",
  food_logs: "food_logs",
  transport_logs: "transport_logs",
  screen_time: "screen_time_logs",
  mood_logs: "mood_logs",
  sleep_logs: "sleep_logs",
};

export async function getDailyLog(userId, dateValue) {
  const date = validateDate(dateValue);
  const dailyLog = await getOrCreateDailyLog(userId, date);
  const entries = await Promise.all(Object.entries(relatedTables).map(async ([key, table]) => {
    const [rows] = await pool.execute(`SELECT * FROM ${table} WHERE day_id = ? ORDER BY 1`, [dailyLog.day_id]);
    return [key, rows];
  }));
  return {
    daily_log: { day_id: dailyLog.day_id, log_date: date, notes: dailyLog.notes },
    ...Object.fromEntries(entries),
  };
}

export async function updateDailyLog(userId, dateValue, input = {}) {
  const date = validateDate(dateValue);
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw validationError("Request body must be a JSON object");
  }
  if (!Object.hasOwn(input, "notes")) throw validationError("notes is required");
  const notes = input.notes;
  if (notes !== null && typeof notes !== "string") throw validationError("notes must be a string or null");

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const dailyLog = await getOrCreateDailyLog(userId, date, connection);
    await connection.execute(
      "UPDATE daily_logs SET notes = ? WHERE day_id = ? AND user_id = ?",
      [notes, dailyLog.day_id, userId],
    );
    await connection.commit();
    return { ...dailyLog, log_date: date, notes };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}