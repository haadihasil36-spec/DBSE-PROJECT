import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { once } from "node:events";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";

const idColumns = {
  activities: "activity_id", expenses: "expense_id", study_sessions: "study_id",
  food_logs: "food_id", transport_logs: "transport_id", screen_time_logs: "screen_id",
  mood_logs: "mood_id", sleep_logs: "sleep_id",
};

class FakeDatabase {
  dailyLogs = [];
  records = Object.fromEntries(Object.keys(idColumns).map((table) => [table, []]));
  goals = [];
  progress = [];
  nextId = 1;

  async execute(sql, params = []) {
    const query = sql.replace(/\s+/g, " ").trim();
    const normalized = query.toLowerCase();

    if (normalized.startsWith("insert into daily_logs")) {
      const [userId, date] = params;
      let row = this.dailyLogs.find((item) => item.user_id === userId && item.log_date === date);
      if (!row) {
        row = { day_id: this.nextId++, user_id: userId, log_date: date, notes: null };
        this.dailyLogs.push(row);
      }
      return [{ insertId: row.day_id, affectedRows: 1 }, []];
    }
    if (normalized.startsWith("select day_id, user_id, date_format(log_date")) {
      const [userId, date] = params;
      return [this.dailyLogs.filter((row) => row.user_id === userId && row.log_date === date), []];
    }
    if (normalized.startsWith("update daily_logs set notes")) {
      const [notes, dayId, userId] = params;
      const row = this.dailyLogs.find((item) => item.day_id === dayId && item.user_id === userId);
      if (row) row.notes = notes;
      return [{ affectedRows: row ? 1 : 0 }, []];
    }
    if (normalized.startsWith("select category_id from activity_categories")) {
      return [[{ category_id: 1 }].filter((row) => row.category_id === params[0]), []];
    }
    if (normalized.startsWith("select location_id, user_id from locations")) {
      const [locationId] = params;
      const userId = Math.floor(locationId / 10);
      return [locationId % 10 === 1 ? [{ location_id: locationId, user_id: userId }] : [], []];
    }
    if (normalized.startsWith("select category_id, category_name, description from activity_categories")) {
      return [[{ category_id: 1, category_name: "Study", description: null }], []];
    }
    if (normalized.startsWith("select location_id, location_name, location_type from locations")) {
      const userId = params[0];
      return [[{ location_id: userId * 10 + 1, location_name: "Home", location_type: "Residence" }], []];
    }
    if (normalized.startsWith("insert into goals")) {
      const columns = query.match(/\(([^)]+)\)/)[1].split(", ");
      const row = Object.fromEntries(columns.map((column, index) => [column, params[index]]));
      row.goal_id = this.nextId++;
      row.status ??= "Active";
      this.goals.push(row);
      return [{ insertId: row.goal_id, affectedRows: 1 }, []];
    }
    if (normalized.startsWith("select goal_id, user_id, goal_name")) {
      const [goalId, userId] = params;
      return [this.goals.filter((row) => row.goal_id === goalId && row.user_id === userId), []];
    }
    if (normalized.startsWith("select goal_id, goal_name")) {
      return [this.goals.filter((row) => row.user_id === params[0]), []];
    }
    if (normalized.startsWith("select progress_id from goal_progress where goal_id = ? and ((? is not null")) {
      const [goalId, startDate, , endDate] = params;
      const row = this.progress.find((item) => item.goal_id === goalId &&
        ((startDate && item.progress_date < startDate) || (endDate && item.progress_date > endDate)));
      return [row ? [{ progress_id: row.progress_id }] : [], []];
    }
    if (normalized.startsWith("update goals set")) {
      const columns = query.match(/^UPDATE goals SET (.*?) WHERE/i)[1].split(", ").map((part) => part.split(" = ")[0]);
      const goalId = params.at(-2);
      const userId = params.at(-1);
      const row = this.goals.find((item) => item.goal_id === goalId && item.user_id === userId);
      if (row) columns.forEach((column, index) => { row[column] = params[index]; });
      return [{ affectedRows: row ? 1 : 0 }, []];
    }
    if (normalized.startsWith("delete from goals")) {
      const [goalId, userId] = params;
      const index = this.goals.findIndex((row) => row.goal_id === goalId && row.user_id === userId);
      if (index < 0) return [{ affectedRows: 0 }, []];
      this.goals.splice(index, 1);
      this.progress = this.progress.filter((row) => row.goal_id !== goalId);
      return [{ affectedRows: 1 }, []];
    }
    if (normalized.startsWith("insert into goal_progress")) {
      const [goalId, date, value] = params;
      if (this.progress.some((row) => row.goal_id === goalId && row.progress_date === date)) {
        const error = new Error("duplicate");
        error.code = "ER_DUP_ENTRY";
        throw error;
      }
      const row = { progress_id: this.nextId++, goal_id: goalId, progress_date: date, actual_value: value };
      this.progress.push(row);
      return [{ insertId: row.progress_id, affectedRows: 1 }, []];
    }
    if (normalized.startsWith("select progress_id from goal_progress where goal_id = ? and progress_date = ?")) {
      const row = this.progress.find((item) => item.goal_id === params[0] && item.progress_date === params[1]);
      return [row ? [{ progress_id: row.progress_id }] : [], []];
    }
    if (normalized.startsWith("select progress_id, goal_id, date_format(progress_date")) {
      return [this.progress.filter((row) => row.goal_id === params[0]), []];
    }
    if (normalized.startsWith("update goal_progress set actual_value")) {
      const [value, goalId, date] = params;
      const row = this.progress.find((item) => item.goal_id === goalId && item.progress_date === date);
      if (row) row.actual_value = value;
      return [{ affectedRows: row ? 1 : 0 }, []];
    }
    if (normalized.startsWith("delete from goal_progress")) {
      const [goalId, date] = params;
      const index = this.progress.findIndex((row) => row.goal_id === goalId && row.progress_date === date);
      if (index < 0) return [{ affectedRows: 0 }, []];
      this.progress.splice(index, 1);
      return [{ affectedRows: 1 }, []];
    }

    const insertMatch = /^INSERT INTO (\w+) \((.*?)\) VALUES/i.exec(query);
    if (insertMatch && this.records[insertMatch[1]]) {
      const [, table, fieldText] = insertMatch;
      const columns = fieldText.split(", ");
      const row = Object.fromEntries(columns.map((column, index) => [column, params[index]]));
      row[idColumns[table]] = this.nextId++;
      this.records[table].push(row);
      return [{ insertId: row[idColumns[table]], affectedRows: 1 }, []];
    }
    const recordSelect = /^SELECT records\.\*, DATE_FORMAT\(daily_logs\.log_date/i.exec(query);
    if (recordSelect) {
      const table = /^SELECT .* FROM (\w+) AS records INNER JOIN daily_logs/i.exec(query)[1];
      const rows = this.records[table].filter((row) => {
        const dailyLog = this.dailyLogs.find((item) => item.day_id === row.day_id);
        if (normalized.includes("where records.")) {
          return dailyLog && row[idColumns[table]] === params[0] && dailyLog.user_id === params[1];
        }
        return dailyLog && dailyLog.user_id === params[0] && (params.length === 1 || dailyLog.log_date === params[1]);
      }).map((row) => ({ ...row, log_date: this.dailyLogs.find((item) => item.day_id === row.day_id).log_date }));
      return [rows, []];
    }
    const childSelect = /^SELECT \* FROM (\w+) WHERE day_id/i.exec(query);
    if (childSelect) return [this.records[childSelect[1]].filter((row) => row.day_id === params[0]), []];
    const updateRecord = /^UPDATE (\w+) SET (.*?) WHERE (\w+) = \?/i.exec(query);
    if (updateRecord && this.records[updateRecord[1]]) {
      const [, table, assignments, idColumn] = updateRecord;
      const columns = assignments.split(", ").map((part) => part.split(" = ")[0]);
      const id = params.at(-1);
      const row = this.records[table].find((item) => item[idColumn] === id);
      if (row) columns.forEach((column, index) => { row[column] = params[index]; });
      return [{ affectedRows: row ? 1 : 0 }, []];
    }
    const deleteRecord = /^DELETE records FROM (\w+) AS records INNER JOIN daily_logs/i.exec(query);
    if (deleteRecord) {
      const [, table] = deleteRecord;
      const [id, userId] = params;
      const index = this.records[table].findIndex((row) => {
        const log = this.dailyLogs.find((item) => item.day_id === row.day_id);
        return row[idColumns[table]] === id && log?.user_id === userId;
      });
      if (index < 0) return [{ affectedRows: 0 }, []];
      this.records[table].splice(index, 1);
      return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unmocked query: ${query}`);
  }

  connection() {
    return {
      execute: this.execute.bind(this),
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => {},
      release: () => {},
    };
  }
}

let server;
let baseUrl;
let database;
const originalExecute = pool.execute;
const originalGetConnection = pool.getConnection;

function token(userId) {
  return jwt.sign({ user_id: userId }, env.jwtSecret);
}

async function request(path, { userId, method = "GET", body } = {}) {
  const headers = {};
  if (userId) headers.authorization = `Bearer ${token(userId)}`;
  if (body !== undefined) headers["content-type"] = "application/json";
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

before(async () => {
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  pool.execute = originalExecute;
  pool.getConnection = originalGetConnection;
  server.close();
  await once(server, "close");
});

beforeEach(() => {
  database = new FakeDatabase();
  pool.execute = database.execute.bind(database);
  pool.getConnection = async () => database.connection();
});

test("rejects unauthenticated access to all user-owned route groups", async () => {
  for (const path of ["/api/locations", "/api/daily-logs/2026-09-01", "/api/goals", "/api/activities"]) {
    const response = await request(path);
    assert.equal(response.status, 401, path);
  }
});

test("supports authenticated CRUD for every daily-log resource with JWT ownership", async () => {
  const cases = [
    ["activities", { category_id: 1, location_id: 11, activity_name: "Walk", start_time: "2026-09-01 09:00:00", end_time: "2026-09-01 10:00:00" }, "activity_name", "Run"],
    ["expenses", { category: "Food", amount: 5 }, "category", "Travel"],
    ["study-sessions", { subject: "Math", start_time: "2026-09-01 09:00:00", end_time: "2026-09-01 10:00:00", productivity_rating: 4 }, "subject", "Science"],
    ["food-logs", { meal_type: "Lunch", food_name: "Rice" }, "food_name", "Soup"],
    ["transport-logs", { mode: "Bus" }, "mode", "Train"],
    ["screen-time", { application_name: "Browser", duration_minutes: 20 }, "application_name", "Reader"],
    ["mood-logs", { mood: "Calm", mood_score: 7 }, "mood", "Happy"],
    ["sleep-logs", { sleep_start: "2026-09-01 22:00:00", sleep_end: "2026-09-02 06:00:00", quality_score: 4 }, "quality_score", 5],
  ];

  for (const [resource, values, updateField, updateValue] of cases) {
    const createResponse = await request(`/api/${resource}`, {
      userId: 1,
      method: "POST",
      body: { ...values, date: "2026-09-01", user_id: 2 },
    });
    assert.equal(createResponse.status, 201, resource);
    const created = (await createResponse.json()).data;
    const recordId = created[idColumns[resource === "screen-time" ? "screen_time_logs" : resource.replaceAll("-", "_")]];
    const getResponse = await request(`/api/${resource}/${recordId}`, { userId: 1 });
    assert.equal(getResponse.status, 200, resource);
    assert.equal((await getResponse.json()).data.log_date, "2026-09-01");

    const foreignRead = await request(`/api/${resource}/${recordId}`, { userId: 2 });
    assert.equal(foreignRead.status, 404, resource);
    const foreignUpdate = await request(`/api/${resource}/${recordId}`, {
      userId: 2, method: "PUT", body: { [updateField]: updateValue },
    });
    assert.equal(foreignUpdate.status, 404, resource);
    const updateResponse = await request(`/api/${resource}/${recordId}`, {
      userId: 1, method: "PUT", body: { [updateField]: updateValue },
    });
    assert.equal(updateResponse.status, 200, resource);
    assert.equal((await updateResponse.json()).data[updateField], updateValue);
    const foreignDelete = await request(`/api/${resource}/${recordId}`, { userId: 2, method: "DELETE" });
    assert.equal(foreignDelete.status, 404, resource);
    const deleteResponse = await request(`/api/${resource}/${recordId}`, { userId: 1, method: "DELETE" });
    assert.equal(deleteResponse.status, 204, resource);
  }
});

test("validates dates, time ranges, ratings, meal type, and scopes daily logs and locations", async () => {
  const invalidDate = await request("/api/daily-logs/2026-02-30", { userId: 1 });
  assert.equal(invalidDate.status, 400);
  const invalidRange = await request("/api/activities", {
    userId: 1,
    method: "POST",
    body: { category_id: 1, activity_name: "Bad", start_time: "2026-09-01 11:00:00", end_time: "2026-09-01 10:00:00" },
  });
  assert.equal(invalidRange.status, 400);
  const invalidRating = await request("/api/mood-logs", {
    userId: 1,
    method: "POST",
    body: { date: "2026-09-01", mood: "Fine", mood_score: 11 },
  });
  assert.equal(invalidRating.status, 400);
  const nullAmount = await request("/api/expenses", {
    userId: 1,
    method: "POST",
    body: { date: "2026-09-01", category: "Food", amount: null },
  });
  assert.equal(nullAmount.status, 400);
  const invalidMeal = await request("/api/food-logs", {
    userId: 1,
    method: "POST",
    body: { date: "2026-09-01", meal_type: "Brunch", food_name: "Toast" },
  });
  assert.equal(invalidMeal.status, 400);
  const foreignLocation = await request("/api/activities", {
    userId: 1,
    method: "POST",
    body: {
      date: "2026-09-01", category_id: 1, location_id: 21,
      activity_name: "Foreign location", start_time: "2026-09-01 09:00:00", end_time: "2026-09-01 10:00:00",
    },
  });
  assert.equal(foreignLocation.status, 403);

  const first = await request("/api/locations", { userId: 1 });
  const second = await request("/api/locations", { userId: 2 });
  assert.deepEqual((await first.json()).data.map((row) => row.location_id), [11]);
  assert.deepEqual((await second.json()).data.map((row) => row.location_id), [21]);
  const dailyLog = await request("/api/daily-logs/2026-09-01", { userId: 1 });
  assert.equal(dailyLog.status, 200);
  assert.equal((await dailyLog.json()).data.daily_log.log_date, "2026-09-01");
});

test("enforces goal and goal-progress ownership and CRUD", async () => {
  const createResponse = await request("/api/goals", {
    userId: 1,
    method: "POST",
    body: { user_id: 2, goal_name: "Read", start_date: "2026-09-01", end_date: "2026-09-30", target_value: 10 },
  });
  assert.equal(createResponse.status, 201);
  const goal = (await createResponse.json()).data;
  const ownGoals = await request("/api/goals", { userId: 1 });
  const otherGoals = await request("/api/goals", { userId: 2 });
  assert.equal((await ownGoals.json()).data.length, 1);
  assert.equal((await otherGoals.json()).data.length, 0);
  const updateGoal = await request(`/api/goals/${goal.goal_id}`, {
    userId: 1, method: "PUT", body: { goal_name: "Read daily" },
  });
  assert.equal(updateGoal.status, 200);
  assert.equal((await updateGoal.json()).data.goal_name, "Read daily");
  const progressResponse = await request(`/api/goals/${goal.goal_id}/progress`, {
    userId: 1, method: "POST", body: { progress_date: "2026-09-05", actual_value: 2 },
  });
  assert.equal(progressResponse.status, 201);
  const progress = (await progressResponse.json()).data;
  const duplicateProgress = await request(`/api/goals/${goal.goal_id}/progress`, {
    userId: 1, method: "POST", body: { progress_date: "2026-09-05", actual_value: 3 },
  });
  assert.equal(duplicateProgress.status, 409);

  for (const [method, path, body] of [
    ["GET", `/api/goals/${goal.goal_id}/progress`],
    ["POST", `/api/goals/${goal.goal_id}/progress`, { progress_date: "2026-09-06", actual_value: 3 }],
    ["PUT", `/api/goals/${goal.goal_id}/progress/2026-09-05`, { actual_value: 3 }],
    ["DELETE", `/api/goals/${goal.goal_id}/progress/2026-09-05`],
  ]) {
    const response = await request(path, { userId: 2, method, body });
    assert.equal(response.status, 404, path);
  }

  const updatedProgress = await request(`/api/goals/${goal.goal_id}/progress/2026-09-05`, {
    userId: 1, method: "PUT", body: { actual_value: 4 },
  });
  assert.equal(updatedProgress.status, 200);
  assert.equal((await updatedProgress.json()).data.actual_value, 4);
  assert.equal(progress.goal_id, goal.goal_id);
  const deleteProgress = await request(`/api/goals/${goal.goal_id}/progress/2026-09-05`, {
    userId: 1, method: "DELETE",
  });
  assert.equal(deleteProgress.status, 204);

  const foreignGoalUpdate = await request(`/api/goals/${goal.goal_id}`, { userId: 2, method: "PUT", body: { goal_name: "Stolen" } });
  assert.equal(foreignGoalUpdate.status, 404);
  const invalidProgressDate = await request(`/api/goals/${goal.goal_id}/progress`, {
    userId: 1, method: "POST", body: { progress_date: "2026-10-01", actual_value: 1 },
  });
  assert.equal(invalidProgressDate.status, 400);
  const deleteGoal = await request(`/api/goals/${goal.goal_id}`, { userId: 1, method: "DELETE" });
  assert.equal(deleteGoal.status, 204);
});