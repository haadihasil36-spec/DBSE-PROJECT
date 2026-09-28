import assert from "node:assert/strict";
import { after, before, beforeEach, test } from "node:test";
import { once } from "node:events";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { env } from "../config/env.js";
import { pool } from "../db/pool.js";

const fixtureDate = "2026-09-10";

class InsightDatabase {
  calls = [];

  async execute(sql, params = []) {
    const query = sql.replace(/\s+/g, " ").trim();
    const normalized = query.toLowerCase();
    this.calls.push({ query, params });

    if (normalized.startsWith("select date_format(curdate()")) {
      return [[{ today: "2026-09-28" }], []];
    }

    if (normalized.includes("daily_summary as summary")) {
      const userId = params[0];
      return [[this.isOwner(userId) ? {
        date: "2026-09-28", spending: "20.00", study_minutes: 120, screen_minutes: 30,
        mood_score: 8, activity_count: 2, sleep_duration_hours: "7.50", sleep_quality: 4,
      } : {
        date: "2026-09-28", spending: 0, study_minutes: 0, screen_minutes: 0,
        mood_score: null, activity_count: 0, sleep_duration_hours: null, sleep_quality: null,
      }], []];
    }
    if (normalized.includes("from weekly_expense_summary")) {
      return [[{ spending: this.isOwner(params[0]) ? "20.00" : 0 }], []];
    }
    if (normalized.includes("as screen_minutes") && normalized.includes("from (select date_add")) {
      const rows = Array.from({ length: 7 }, (_, index) => ({
        date: `2026-09-${String(21 + index).padStart(2, "0")}`,
        spending: this.isOwner(params[0]) && index === 0 ? "20.00" : 0,
        study_seconds: this.isOwner(params[0]) && index === 0 ? 3600 : 0,
        screen_minutes: this.isOwner(params[0]) && index === 0 ? 30 : 0,
      }));
      return [rows, []];
    }
    if (normalized.includes("from goals as goal") && normalized.includes("goal.status = 'active'")) {
      return [this.isOwner(params[0]) ? [{
        goal_id: 1, goal_name: "Study", goal_type: "Study", target_value: "10.00",
        current_value: "4.00", progress_date: fixtureDate, unit: "hours", status: "Active",
      }] : [], []];
    }
    if (normalized.startsWith("select activity.activity_id")) {
      return [this.isOwner(params[0]) ? [{ activity_id: 10, activity_name: "Study", category_name: "Study", log_date: fixtureDate }] : [], []];
    }
    if (normalized.startsWith("select expense.expense_id")) {
      return [this.isOwner(params[0]) ? [{ expense_id: 10, category: "Food", amount: "20.00", log_date: fixtureDate }] : [], []];
    }

    const userId = params[0];
    const inRange = this.isOwner(userId) && params[1] <= fixtureDate && params[2] >= fixtureDate;
    if (normalized.startsWith("select expense.category, sum(")) {
      return [inRange ? [{ category: "Food", amount: "20.00" }, { category: "Travel", amount: "5.00" }] : [], []];
    }
    if (normalized.startsWith("select date_format(logs.log_date") && normalized.includes("from expenses as expense")) {
      return [inRange ? [{ date: fixtureDate, amount: "25.00" }] : [], []];
    }
    if (normalized.startsWith("select study.subject, sum(")) {
      return [inRange ? [{ subject: "Math", study_seconds: 3600, session_count: 1 }] : [], []];
    }
    if (normalized.startsWith("select date_format(logs.log_date") && normalized.includes("from study_sessions as study")) {
      return [inRange ? [{ date: fixtureDate, study_seconds: 3600 }] : [], []];
    }
    if (normalized.startsWith("select study.subject, avg(")) {
      return [inRange ? [{ subject: "Math", average_rating: 4, rated_sessions: 1 }] : [], []];
    }
    if (normalized.startsWith("select screen.application_name")) {
      return [inRange ? [{ application_name: "Browser", minutes: 60 }] : [], []];
    }
    if (normalized.startsWith("select coalesce(screen.category")) {
      return [inRange ? [{ category: "Productivity", minutes: 60 }] : [], []];
    }
    if (normalized.startsWith("select date_format(logs.log_date") && normalized.includes("from mood_logs as mood")) {
      return [inRange ? [{ date: fixtureDate, average_score: 8, entry_count: 1 }] : [], []];
    }
    if (normalized.startsWith("select date_format(logs.log_date") && normalized.includes("from sleep_logs as sleep")) {
      return [inRange ? [{ date: fixtureDate, sleep_seconds: 28800, average_quality: 4, sleep_count: 1 }] : [], []];
    }
    if (normalized.startsWith("select category.category_name as category")) {
      return [inRange ? [{ category: "Exercise", activity_seconds: 3600, activity_count: 2 }] : [], []];
    }
    if (normalized.startsWith("select coalesce(location.location_name")) {
      return [inRange ? [{ location: "Gym", activity_seconds: 3600, visit_count: 2 }] : [], []];
    }
    if (normalized.startsWith("select transport.mode")) {
      return [inRange ? [{ mode: "Bus", duration_minutes: 15, distance_km: "4.50" }] : [], []];
    }
    if (normalized.startsWith("select food.meal_type")) {
      return [inRange ? [{ meal_type: "Lunch", amount: "5.00" }] : [], []];
    }
    if (normalized.startsWith("select dayofweek(logs.log_date")) {
      return [inRange ? [{ day_of_week: 5, average_rating: 4, rated_sessions: 1, study_seconds: 3600 }] : [], []];
    }
    if (normalized.startsWith("select date_format(calendar.log_date")) {
      return [inRange ? [{ date: fixtureDate, study_seconds: 3600, average_productivity: 4, sleep_seconds: 28800 }] : [], []];
    }

    if (normalized.includes("current_progress.actual_value")) {
      const ownerId = params[3];
      return [this.isOwner(ownerId) ? [{
        goal_id: 1, goal_name: "Study", goal_type: "Study", status: "Active", target_value: "10.00",
        current_value: "4.00", range_value: "4.00", current_progress_date: fixtureDate,
        range_progress_date: fixtureDate, unit: "hours",
      }] : [], []];
    }
    if (normalized.startsWith("select coalesce(sum(expense.amount)")) {
      return [[{ amount: inRange ? "25.00" : 0 }], []];
    }
    if (normalized.includes("as average_productivity") && normalized.includes("from study_sessions as study")) {
      return [[inRange ? { study_seconds: 3600, average_productivity: 4, session_count: 1, rated_sessions: 1 }
        : { study_seconds: 0, average_productivity: null, session_count: 0, rated_sessions: 0 }], []];
    }
    if (normalized.startsWith("select count(*) as activity_count")) {
      return [[inRange ? { activity_count: 2, activity_seconds: 3600, exercise_seconds: 1800, exercise_count: 1 }
        : { activity_count: 0, activity_seconds: 0, exercise_seconds: 0, exercise_count: 0 }], []];
    }
    if (normalized.startsWith("select coalesce(sum(screen.duration_minutes), 0) as screen_minutes")) {
      return [[{ screen_minutes: inRange ? 60 : 0 }], []];
    }
    if (normalized.includes("as spent_amount")) {
      return [this.isOwner(params[2]) ? [{ goal_id: 2, goal_name: "Budget", target_value: "100.00", spent_amount: "25.00" }] : [], []];
    }
    throw new Error(`Unexpected insight query: ${query}`);
  }

  isOwner(userId) {
    return userId === 11;
  }
}

let server;
let baseUrl;
let fake;
const originalExecute = pool.execute;

function authToken(userId) {
  return jwt.sign({ user_id: userId }, env.jwtSecret);
}

async function request(path, userId) {
  const headers = userId ? { authorization: `Bearer ${authToken(userId)}` } : {};
  return fetch(`${baseUrl}${path}`, { headers });
}

before(async () => {
  server = app.listen(0);
  await once(server, "listening");
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  pool.execute = originalExecute;
  server.close();
  await once(server, "close");
});

beforeEach(() => {
  fake = new InsightDatabase();
  pool.execute = fake.execute.bind(fake);
});

test("insight endpoints reject unauthenticated requests", async () => {
  for (const path of ["/api/dashboard", "/api/analytics", "/api/progress"]) {
    assert.equal((await request(path)).status, 401);
  }
});

test("dashboard returns a predictable sparse-data shape scoped to the caller", async () => {
  const owner = await request("/api/dashboard", 11);
  const sparseUser = await request("/api/dashboard", 22);
  assert.equal(owner.status, 200);
  assert.equal(sparseUser.status, 200);
  const ownerBody = await owner.json();
  const sparseBody = await sparseUser.json();
  assert.equal(ownerBody.summary.today.activityCount, 2);
  assert.equal(ownerBody.summary.today.studyHours, 2);
  assert.equal(ownerBody.summary.today.spending, 20);
  assert.equal(ownerBody.activeGoals.length, 1);
  assert.equal(sparseBody.summary.today.activityCount, 0);
  assert.equal(sparseBody.activeGoals.length, 0);
  assert.deepEqual(sparseBody.recentActivities, []);
  assert.equal(sparseBody.charts.weeklySpending.length, 7);
  assert.ok(fake.calls.some(({ params }) => params.includes(11)));
  assert.ok(fake.calls.some(({ params }) => params.includes(22)));
});

test("analytics date filtering, equal-valued expenses, percentages, and user isolation", async () => {
  const ownerResponse = await request(`/api/analytics?from=${fixtureDate}&to=${fixtureDate}`, 11);
  const otherResponse = await request(`/api/analytics?from=${fixtureDate}&to=${fixtureDate}`, 22);
  assert.equal(ownerResponse.status, 200);
  assert.equal(otherResponse.status, 200);
  const owner = await ownerResponse.json();
  const other = await otherResponse.json();
  assert.equal(owner.summary.totalSpending, 25);
  assert.equal(owner.charts.spendingByCategory[0].amount, 20);
  assert.equal(owner.charts.spendingByCategory[0].percentage, 80);
  assert.equal(owner.charts.studyBySubject[0].hours, 1);
  assert.equal(owner.insights.find((item) => item.key === "mostStudiedSubject").value, "Math");
  assert.equal(other.summary.totalSpending, 0);
  assert.deepEqual(other.charts.spendingByCategory, []);
  assert.ok(fake.calls.every(({ query }) => !/SUM\s*\(\s*DISTINCT\s+expense\.amount/i.test(query)));
  assert.ok(fake.calls.some(({ params }) => params[0] === 11 && params[1] === fixtureDate && params[2] === fixtureDate));
});

test("empty analytics ranges return zero summaries and all chart arrays", async () => {
  const response = await request("/api/analytics?from=2098-01-01&to=2098-01-07", 11);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.summary.totalSpending, 0);
  for (const chart of Object.values(body.charts)) assert.deepEqual(chart, []);
  assert.equal(body.insights.find((item) => item.key === "mostProductiveDay").value, null);
});

test("analytics rejects reversed and unbounded date ranges", async () => {
  assert.equal((await request("/api/analytics?from=2026-09-12&to=2026-09-10", 11)).status, 400);
  assert.equal((await request("/api/analytics?from=2024-01-01&to=2026-01-01", 11)).status, 400);
  assert.equal((await request("/api/analytics?from=nope", 11)).status, 400);
});

test("progress supports date ranges and scopes goals and metrics to the caller", async () => {
  const ownerResponse = await request("/api/progress?date=2026-09-10&range=week", 11);
  const otherResponse = await request("/api/progress?date=2026-09-10&range=week", 22);
  assert.equal(ownerResponse.status, 200);
  assert.equal(otherResponse.status, 200);
  const owner = await ownerResponse.json();
  const other = await otherResponse.json();
  assert.deepEqual(owner.range, { date: "2026-09-10", type: "week", from: "2026-09-07", to: "2026-09-13" });
  assert.equal(owner.goals.length, 1);
  assert.equal(other.goals.length, 0);
  assert.equal(owner.summary.spending, 25);
  assert.equal(other.summary.spending, 0);
  assert.equal(owner.budgetGoals[0].spentAmount, 25);
});

test("progress rejects invalid dates and ranges", async () => {
  assert.equal((await request("/api/progress?date=2026-02-30", 11)).status, 400);
  assert.equal((await request("/api/progress?range=year", 11)).status, 400);
});