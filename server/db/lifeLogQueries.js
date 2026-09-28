import { pool } from "./pool.js";

export async function getOrCreateDailyLog(userId, date, executor = pool) {
  await executor.execute(
    `INSERT INTO daily_logs (user_id, log_date)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE day_id = LAST_INSERT_ID(day_id)`,
    [userId, date],
  );

  const [rows] = await executor.execute(
    `SELECT day_id, user_id, DATE_FORMAT(log_date, '%Y-%m-%d') AS log_date, notes
     FROM daily_logs
     WHERE user_id = ? AND log_date = ?
     LIMIT 1`,
    [userId, date],
  );
  return rows[0];
}