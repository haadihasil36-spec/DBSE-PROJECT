const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json();
}

export const api = {
  getDashboard: (userId) => request(`/dashboard/${userId}`),
  getActivities: (userId) => request(`/activities?userId=${userId}`),
  getExpenses: (userId) => request(`/expenses?userId=${userId}`),
  getStudy: (userId) => request(`/study?userId=${userId}`),
  getGoals: (userId) => request(`/goals?userId=${userId}`),
};