import { pool } from "../db/pool.js";
import {
  conflictError,
  notFoundError,
  validationError,
  validateDate,
  validateId,
  validateLogInput,
} from "../validators/coreValidators.js";

const goalFields = {
  goal_name: { type: "string", max: 150, required: true },
  goal_type: { type: "string", max: 50, nullable: true },
  target_value: { type: "number", min: 0, max: 99999999.99, nullable: true },
  unit: { type: "string", max: 30, nullable: true },
  start_date: { type: "date", nullable: true },
  end_date: { type: "date", nullable: true },
  status: { type: "enum", values: ["Active", "Completed", "Failed"] },
};

const progressFields = {
  progress_date: { type: "date", required: true },
  actual_value: { type: "number", min: 0, max: 99999999.99, required: true },
};

function checkGoalRange(startDate, endDate) {
  if (startDate && endDate && startDate > endDate) {
    throw validationError("start_date must be on or before end_date");
  }
}

function checkProgressDate(date, goal) {
  if ((goal.start_date && date < String(goal.start_date).slice(0, 10)) ||
      (goal.end_date && date > String(goal.end_date).slice(0, 10))) {
    throw validationError("progress_date must fall within the goal date range");
  }
}

async function findGoal(goalId, userId, executor = pool, lock = false) {
  const [rows] = await executor.execute(
    `SELECT goal_id, user_id, goal_name, goal_type, target_value, unit,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, status
     FROM goals
     WHERE goal_id = ? AND user_id = ?
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [goalId, userId],
  );
  if (!rows[0]) throw notFoundError("Goal not found");
  return rows[0];
}

async function withTransaction(work) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await work(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw conflictError();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listGoals(userId) {
  const [rows] = await pool.execute(
    `SELECT goal_id, goal_name, goal_type, target_value, unit,
            DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date, status
     FROM goals WHERE user_id = ? ORDER BY goal_id DESC`,
    [userId],
  );
  return rows;
}

export async function createGoal(input, userId) {
  const values = validateLogInput(input, goalFields);
  checkGoalRange(values.start_date, values.end_date);
  const columns = ["user_id", ...Object.keys(values)];
  const [result] = await pool.execute(
    `INSERT INTO goals (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`,
    [userId, ...Object.values(values)],
  );
  return findGoal(result.insertId, userId);
}

export async function updateGoal(idValue, input, userId) {
  const goalId = validateId(idValue);
  const values = validateLogInput(input, goalFields, { partial: true });
  return withTransaction(async (connection) => {
    const current = await findGoal(goalId, userId, connection, true);
    const startDate = values.start_date === undefined ? current.start_date : values.start_date;
    const endDate = values.end_date === undefined ? current.end_date : values.end_date;
    checkGoalRange(startDate, endDate);
    const [outOfRange] = await connection.execute(
      `SELECT progress_id FROM goal_progress
       WHERE goal_id = ? AND ((? IS NOT NULL AND progress_date < ?) OR (? IS NOT NULL AND progress_date > ?))
       LIMIT 1`,
      [goalId, startDate, startDate, endDate, endDate],
    );
    if (outOfRange[0]) throw conflictError("Goal date range would exclude existing progress");
    const columns = Object.keys(values);
    if (columns.length) {
      await connection.execute(
        `UPDATE goals SET ${columns.map((column) => `${column} = ?`).join(", ")}
         WHERE goal_id = ? AND user_id = ?`,
        [...columns.map((column) => values[column]), goalId, userId],
      );
    }
    return findGoal(goalId, userId, connection);
  });
}

export async function deleteGoal(idValue, userId) {
  const goalId = validateId(idValue);
  await withTransaction(async (connection) => {
    await findGoal(goalId, userId, connection, true);
    await connection.execute("DELETE FROM goals WHERE goal_id = ? AND user_id = ?", [goalId, userId]);
  });
}

export async function listGoalProgress(idValue, userId) {
  const goalId = validateId(idValue);
  await findGoal(goalId, userId);
  const [rows] = await pool.execute(
    `SELECT progress_id, goal_id, DATE_FORMAT(progress_date, '%Y-%m-%d') AS progress_date, actual_value
     FROM goal_progress WHERE goal_id = ? ORDER BY progress_date`,
    [goalId],
  );
  return rows;
}

export async function createGoalProgress(idValue, input, userId) {
  const goalId = validateId(idValue);
  const values = validateLogInput(input, progressFields);
  return withTransaction(async (connection) => {
    const goal = await findGoal(goalId, userId, connection, true);
    checkProgressDate(values.progress_date, goal);
    const [result] = await connection.execute(
      "INSERT INTO goal_progress (goal_id, progress_date, actual_value) VALUES (?, ?, ?)",
      [goalId, values.progress_date, values.actual_value],
    );
    return { progress_id: result.insertId, goal_id: goalId, ...values };
  });
}

export async function updateGoalProgress(idValue, dateValue, input, userId) {
  const goalId = validateId(idValue);
  const date = validateDate(dateValue, "date");
  const values = validateLogInput(input, { actual_value: progressFields.actual_value }, { partial: true });
  if (values.actual_value === undefined) throw validationError("actual_value is required");
  return withTransaction(async (connection) => {
    const goal = await findGoal(goalId, userId, connection, true);
    checkProgressDate(date, goal);
    const [existing] = await connection.execute(
      "SELECT progress_id FROM goal_progress WHERE goal_id = ? AND progress_date = ? LIMIT 1",
      [goalId, date],
    );
    if (!existing[0]) throw notFoundError("Goal progress not found");
    await connection.execute(
      "UPDATE goal_progress SET actual_value = ? WHERE goal_id = ? AND progress_date = ?",
      [values.actual_value, goalId, date],
    );
    return { progress_id: existing[0].progress_id, goal_id: goalId, progress_date: date, ...values };
  });
}

export async function deleteGoalProgress(idValue, dateValue, userId) {
  const goalId = validateId(idValue);
  const date = validateDate(dateValue, "date");
  await withTransaction(async (connection) => {
    await findGoal(goalId, userId, connection, true);
    const [result] = await connection.execute(
      "DELETE FROM goal_progress WHERE goal_id = ? AND progress_date = ?",
      [goalId, date],
    );
    if (!result.affectedRows) throw notFoundError("Goal progress not found");
  });
}