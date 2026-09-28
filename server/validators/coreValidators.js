const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
const dateTimePattern = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

export function validationError(message, details = []) {
  const error = new Error(message);
  error.statusCode = 400;
  if (details.length) error.details = details;
  return error;
}

export function notFoundError(message = "Record not found") {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

export function conflictError(message = "Record already exists") {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

export function validateId(value, name = "id") {
  if (!/^\d+$/.test(String(value ?? ""))) {
    throw validationError(`${name} must be a positive integer`);
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw validationError(`${name} must be a positive integer`);
  }
  return id;
}

function validCalendarDate(year, month, day) {
  if (year < 1000 || year > 9999) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function validateDate(value, name = "date") {
  if (typeof value !== "string") throw validationError(`${name} must use YYYY-MM-DD format`);
  const match = datePattern.exec(value);
  if (!match || !validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))) {
    throw validationError(`${name} must be a valid date in YYYY-MM-DD format`);
  }
  return value;
}

export function validateDateTime(value, name = "datetime") {
  if (typeof value !== "string") throw validationError(`${name} must be a valid datetime`);
  const match = dateTimePattern.exec(value);
  if (!match) throw validationError(`${name} must use YYYY-MM-DD HH:mm:ss format`);
  validateDate(match[1], name);
  const [hours, minutes, seconds = "00"] = match.slice(2);
  if (Number(hours) > 23 || Number(minutes) > 59 || Number(seconds) > 59) {
    throw validationError(`${name} must be a valid datetime`);
  }
  return `${match[1]} ${hours}:${minutes}:${seconds}`;
}

function normalizeField(value, field, name) {
  if (value === null && field.nullable) return null;

  if (field.type === "string") {
    if (typeof value !== "string") throw validationError(`${name} must be a string`);
    const normalized = value.trim();
    if (!normalized && field.required) throw validationError(`${name} is required`);
    if (normalized.length > field.max) throw validationError(`${name} must be ${field.max} characters or fewer`);
    return normalized;
  }

  if (field.type === "id") return validateId(value, name);
  if (field.type === "date") return validateDate(value, name);
  if (field.type === "datetime") return validateDateTime(value, name);
  if (field.type === "enum") {
    if (!field.values.includes(value)) throw validationError(`${name} must be one of: ${field.values.join(", ")}`);
    return value;
  }
  if (field.type === "number") {
    if (value === null || (typeof value === "string" && !value.trim())) {
      throw validationError(`${name} must be numeric`);
    }
    const number = typeof value === "number" ? value : Number(value);
    if (value === "" || value === undefined || !Number.isFinite(number)) {
      throw validationError(`${name} must be numeric`);
    }
    if (field.integer && !Number.isInteger(number)) throw validationError(`${name} must be an integer`);
    if (number < field.min || number > field.max) {
      throw validationError(`${name} must be between ${field.min} and ${field.max}`);
    }
    return number;
  }
  return value;
}

export function validateLogInput(input = {}, fields, { partial = false } = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw validationError("Request body must be a JSON object");
  }

  const output = {};
  const details = [];
  for (const [name, field] of Object.entries(fields)) {
    if (!Object.hasOwn(input, name)) {
      if (!partial && field.required) details.push(`${name} is required`);
      continue;
    }
    try {
      output[name] = normalizeField(input[name], field, name);
    } catch (error) {
      details.push(error.message);
    }
  }

  if (details.length) throw validationError("Validation failed", details);
  if (!partial && !Object.keys(output).length) throw validationError("Request body is required");
  if (partial && !Object.keys(output).length && !Object.hasOwn(input, "date") && !Object.hasOwn(input, "log_date")) {
    throw validationError("At least one field is required");
  }
  return output;
}

export function dateFromInput(input, fallback) {
  const date = input.log_date ?? input.date ?? fallback;
  if (date === undefined) throw validationError("date is required");
  return validateDate(date, "date");
}

export function ensureDateTimeRange(start, end, startName, endName) {
  if (start !== undefined && end !== undefined && end <= start) {
    throw validationError(`${endName} must be after ${startName}`);
  }
}

export function forbiddenError(message = "You do not have access to this resource") {
  const error = new Error(message);
  error.statusCode = 403;
  return error;
}