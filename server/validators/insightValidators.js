import { validationError, validateDate } from "./coreValidators.js";

function shiftDate(value, days) {
  const [year, month, day] = value.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

function daysBetween(from, to) {
  return (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86400000;
}

export function resolveAnalyticsRange(query, today) {
  const to = query.to === undefined ? today : validateDate(query.to, "to");
  const from = query.from === undefined ? shiftDate(to, -29) : validateDate(query.from, "from");
  if (from > to) throw validationError("from must be on or before to");
  if (daysBetween(from, to) > 365) {
    throw validationError("Date range must not exceed 366 days");
  }
  return { from, to };
}

export function resolveProgressRange(query, today) {
  const date = query.date === undefined ? today : validateDate(query.date, "date");
  const range = query.range === undefined ? "week" : query.range;
  if (!["day", "week", "month"].includes(range)) {
    throw validationError("range must be day, week, or month");
  }

  if (range === "day") return { date, range, from: date, to: date };
  const [year, month, day] = date.split("-").map(Number);
  const selected = new Date(Date.UTC(year, month - 1, day));
  if (range === "week") {
    const mondayOffset = (selected.getUTCDay() + 6) % 7;
    return {
      date,
      range,
      from: shiftDate(date, -mondayOffset),
      to: shiftDate(date, 6 - mondayOffset),
    };
  }
  const monthStart = `${date.slice(0, 7)}-01`;
  const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  return { date, range, from: monthStart, to: monthEnd };
}