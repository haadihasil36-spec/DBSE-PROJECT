import { pool } from "../db/pool.js";
import { getOrCreateDailyLog } from "../db/lifeLogQueries.js";
import {
  conflictError,
  dateFromInput,
  ensureDateTimeRange,
  forbiddenError,
  notFoundError,
  validateId,
  validateLogInput,
} from "../validators/coreValidators.js";

const positiveAmount = { type: "number", min: 0, max: 99999999.99 };
const nonnegativeInteger = { type: "number", min: 0, max: 2147483647, integer: true };
const resources = {
  activities: {
    table: "activities", idColumn: "activity_id",
    fields: {
      category_id: { type: "id", required: true },
      location_id: { type: "id", nullable: true },
      activity_name: { type: "string", max: 150, required: true },
      start_time: { type: "datetime", required: true },
      end_time: { type: "datetime", required: true },
      description: { type: "string", max: 65535, nullable: true },
    },
    start: "start_time", end: "end_time",
  },
  expenses: {
    table: "expenses", idColumn: "expense_id",
    fields: {
      category: { type: "string", max: 50, required: true }, amount: positiveAmount,
      payment_method: { type: "string", max: 30, nullable: true },
      description: { type: "string", max: 255, nullable: true },
    },
  },
  "study-sessions": {
    table: "study_sessions", idColumn: "study_id",
    fields: {
      subject: { type: "string", max: 100, required: true },
      topic: { type: "string", max: 150, nullable: true },
      start_time: { type: "datetime", required: true },
      end_time: { type: "datetime", required: true },
      productivity_rating: { type: "number", min: 1, max: 5, integer: true, nullable: true },
    },
    start: "start_time", end: "end_time",
  },
  "food-logs": {
    table: "food_logs", idColumn: "food_id",
    fields: {
      meal_type: { type: "enum", values: ["Breakfast", "Lunch", "Dinner", "Snack"], required: true },
      food_name: { type: "string", max: 150, required: true },
      quantity: { type: "string", max: 50, nullable: true },
      calories: { ...nonnegativeInteger, nullable: true }, cost: { ...positiveAmount, nullable: true },
    },
  },
  "transport-logs": {
    table: "transport_logs", idColumn: "transport_id",
    fields: {
      mode: { type: "string", max: 50, required: true },
      source_location: { type: "string", max: 100, nullable: true },
      destination_location: { type: "string", max: 100, nullable: true },
      distance_km: { type: "number", min: 0, max: 999999.99, nullable: true },
      duration_minutes: { ...nonnegativeInteger, nullable: true }, cost: { ...positiveAmount, nullable: true },
    },
  },
  "screen-time": {
    table: "screen_time_logs", idColumn: "screen_id",
    fields: {
      application_name: { type: "string", max: 100, required: true },
      category: { type: "string", max: 50, nullable: true }, duration_minutes: nonnegativeInteger,
    },
  },
  "mood-logs": {
    table: "mood_logs", idColumn: "mood_id",
    fields: {
      mood: { type: "string", max: 50, required: true },
      mood_score: { type: "number", min: 1, max: 10, integer: true, required: true },
      reason: { type: "string", max: 255, nullable: true },
    },
  },
  "sleep-logs": {
    table: "sleep_logs", idColumn: "sleep_id",
    fields: {
      sleep_start: { type: "datetime", required: true }, sleep_end: { type: "datetime", required: true },
      quality_score: { type: "number", min: 1, max: 5, integer: true, nullable: true },
    },
    start: "sleep_start", end: "sleep_end",
  },
};

function getResource(name) {
  const resource = resources[name];
  if (!resource) throw notFoundError("Resource not found");
  return resource;
}

function assertTimeRange(resource, input) {
  if (resource.start && input[resource.start] !== undefined && input[resource.end] !== undefined) {
    ensureDateTimeRange(input[resource.start], input[resource.end], resource.start, resource.end);
  }
}

function resolveLogDate(resource, input, fallback) {
  const startDate = resource.start ? input[resource.start]?.slice(0, 10) : undefined;
  const requestedDate = input.log_date ?? input.date;
  if (startDate && requestedDate !== undefined && requestedDate !== startDate) {
    throw new Error("date must match the start datetime date");
  }
  return dateFromInput(input, startDate ?? fallback);
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

async function verifyReferences(resource, input, userId, executor) {
  if (resource.table === "activities" && input.category_id !== undefined) {
    const [categories] = await executor.execute(
      "SELECT category_id FROM activity_categories WHERE category_id = ? LIMIT 1",
      [input.category_id],
    );
    if (!categories[0]) throw notFoundError("Category not found");
  }
  if (resource.table === "activities" && input.location_id !== undefined && input.location_id !== null) {
    const [locations] = await executor.execute(
      "SELECT location_id, user_id FROM locations WHERE location_id = ? LIMIT 1",
      [input.location_id],
    );
    if (!locations[0]) throw notFoundError("Location not found");
    if (locations[0].user_id !== userId) throw forbiddenError("Location belongs to another user");
  }
}

async function findOwned(resource, id, userId, executor = pool, lock = false) {
  const timeProjection = resource.start
    ? `, DATE_FORMAT(records.${resource.start}, '%Y-%m-%d %H:%i:%s') AS ${resource.start},
       DATE_FORMAT(records.${resource.end}, '%Y-%m-%d %H:%i:%s') AS ${resource.end}`
    : "";
  const [rows] = await executor.execute(
    `SELECT records.*, DATE_FORMAT(daily_logs.log_date, '%Y-%m-%d') AS log_date${timeProjection}
     FROM ${resource.table} AS records
     INNER JOIN daily_logs ON daily_logs.day_id = records.day_id
     WHERE records.${resource.idColumn} = ? AND daily_logs.user_id = ?
     LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [id, userId],
  );
  if (!rows[0]) throw notFoundError();
  return rows[0];
}

export async function listLogs(name, userId, date) {
  const resource = getResource(name);
  const timeProjection = resource.start
    ? `, DATE_FORMAT(records.${resource.start}, '%Y-%m-%d %H:%i:%s') AS ${resource.start},
       DATE_FORMAT(records.${resource.end}, '%Y-%m-%d %H:%i:%s') AS ${resource.end}`
    : "";
  const params = [userId];
  let dateClause = "";
  if (date !== undefined) {
    dateClause = " AND daily_logs.log_date = ?";
    params.push(date);
  }
  const [rows] = await pool.execute(
    `SELECT records.*, DATE_FORMAT(daily_logs.log_date, '%Y-%m-%d') AS log_date${timeProjection}
     FROM ${resource.table} AS records
     INNER JOIN daily_logs ON daily_logs.day_id = records.day_id
     WHERE daily_logs.user_id = ?${dateClause}
     ORDER BY daily_logs.log_date DESC, records.${resource.idColumn} DESC`,
    params,
  );
  return rows;
}

export async function getLog(name, idValue, userId) {
  return findOwned(getResource(name), validateId(idValue), userId);
}

export async function createLog(name, input, userId) {
  const resource = getResource(name);
  const values = validateLogInput(input, resource.fields);
  assertTimeRange(resource, values);
  const date = resolveLogDate(resource, input);

  return withTransaction(async (connection) => {
    await verifyReferences(resource, values, userId, connection);
    const dailyLog = await getOrCreateDailyLog(userId, date, connection);
    const columns = ["day_id", ...Object.keys(values)];
    const placeholders = columns.map(() => "?").join(", ");
    const [result] = await connection.execute(
      `INSERT INTO ${resource.table} (${columns.join(", ")}) VALUES (${placeholders})`,
      [dailyLog.day_id, ...Object.values(values)],
    );
    return findOwned(resource, result.insertId, userId, connection);
  });
}

export async function updateLog(name, idValue, input, userId) {
  const resource = getResource(name);
  const id = validateId(idValue);
  const values = validateLogInput(input, resource.fields, { partial: true });
  return withTransaction(async (connection) => {
    const current = await findOwned(resource, id, userId, connection, true);
    const combinedValues = { ...current, ...values };
    assertTimeRange(resource, combinedValues);
    await verifyReferences(resource, values, userId, connection);
    const startDate = resource.start ? values[resource.start]?.slice(0, 10) : undefined;
    const hasDate = input.date !== undefined || input.log_date !== undefined || startDate !== undefined;
    if (hasDate) values.day_id = (await getOrCreateDailyLog(
      userId,
      resolveLogDate(resource, input, String(current.log_date).slice(0, 10)),
      connection,
    )).day_id;
    const columns = Object.keys(values);
    if (!columns.length) throw new Error("No fields to update");
    const assignments = columns.map((column) => `${column} = ?`).join(", ");
    await connection.execute(
      `UPDATE ${resource.table} SET ${assignments} WHERE ${resource.idColumn} = ?`,
      [...columns.map((column) => values[column]), id],
    );
    return findOwned(resource, id, userId, connection);
  });
}

export async function deleteLog(name, idValue, userId) {
  const resource = getResource(name);
  const id = validateId(idValue);
  const [result] = await pool.execute(
    `DELETE records FROM ${resource.table} AS records
     INNER JOIN daily_logs ON daily_logs.day_id = records.day_id
     WHERE records.${resource.idColumn} = ? AND daily_logs.user_id = ?`,
    [id, userId],
  );
  if (!result.affectedRows) throw notFoundError();
}

export const logResourceNames = Object.keys(resources);