export const TOKEN_KEY = "lifelog-access-token";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const AUTH_FAILURE_EVENT = "lifelog:authentication-failed";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function messageFor(status, payload, path) {
  if (status === 401) {
    if (path.endsWith("/auth/login")) return payload?.error?.message || "Email or password is incorrect.";
    return "Your session has expired. Please log in again.";
  }
  if (status === 403) return "You don't have permission to access this record.";
  if (status === 404) return "Record not found.";
  if (status === 409) return payload?.error?.message || "An account with this email already exists.";
  if (status >= 500) return "Unable to complete the request. Please try again.";
  const details = payload?.error?.details;
  if (Array.isArray(details) && details.length) return details.join(" ");
  return payload?.error?.message || "Please check the submitted information.";
}

async function request(path, { body, headers, ...options } = {}) {
  const requestHeaders = { Accept: "application/json", ...headers };
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  const token = getToken();
  if (token) requestHeaders.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Unable to connect to LifeLog server.");
  }

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(messageFor(response.status, payload, path));
    error.status = response.status;
    error.details = payload?.error?.details;
    if (response.status === 401) window.dispatchEvent(new Event(AUTH_FAILURE_EVENT));
    throw error;
  }
  return payload;
}

const collection = (path) => ({
  list: () => request(path),
  create: (body) => request(path, { method: "POST", body }),
  get: (id) => request(`${path}/${encodeURIComponent(id)}`),
  update: (id, body) => request(`${path}/${encodeURIComponent(id)}`, { method: "PUT", body }),
  remove: (id) => request(`${path}/${encodeURIComponent(id)}`, { method: "DELETE" }),
});

function queryString(values) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  }
  const result = query.toString();
  return result ? `?${result}` : "";
}

export const api = {
  auth: {
    register: (body) => request("/auth/register", { method: "POST", body }),
    login: (body) => request("/auth/login", { method: "POST", body }),
    me: () => request("/auth/me"),
  },
  getDashboard: () => request("/dashboard"),
  getAnalytics: (range = {}) => request(`/analytics${queryString(range)}`),
  getProgress: (range = {}) => request(`/progress${queryString(range)}`),
  getDailyLog: (date) => request(`/daily-logs/${encodeURIComponent(date)}`),
  updateDailyLog: (date, body) => request(`/daily-logs/${encodeURIComponent(date)}`, { method: "PUT", body }),
  getCategories: () => request("/categories"),
  getLocations: () => request("/locations"),
  activities: collection("/activities"),
  expenses: collection("/expenses"),
  studySessions: collection("/study-sessions"),
  foodLogs: collection("/food-logs"),
  transportLogs: collection("/transport-logs"),
  screenTime: collection("/screen-time"),
  moodLogs: collection("/mood-logs"),
  sleepLogs: collection("/sleep-logs"),
  goals: {
    ...collection("/goals"),
    progress: (id) => request(`/goals/${encodeURIComponent(id)}/progress`),
    addProgress: (id, body) => request(`/goals/${encodeURIComponent(id)}/progress`, { method: "POST", body }),
    updateProgress: (id, date, body) => request(`/goals/${encodeURIComponent(id)}/progress/${encodeURIComponent(date)}`, { method: "PUT", body }),
    removeProgress: (id, date) => request(`/goals/${encodeURIComponent(id)}/progress/${encodeURIComponent(date)}`, { method: "DELETE" }),
  },
};

export { AUTH_FAILURE_EVENT };