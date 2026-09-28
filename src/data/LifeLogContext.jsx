import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";

const emptyData = {
  activities: [], expenses: [], studySessions: [], food: [], transport: [],
  screenTime: [], moodSleep: [], goals: [],
};

export function getLocalDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function textDate(value) {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return getLocalDateISO(value);
  return "";
}

function textDateTime(value) {
  if (typeof value === "string") return value.replace("T", " ").replace(/\.\d{3}Z$/, "").replace(/Z$/, "").slice(0, 19);
  if (value instanceof Date) {
    const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 19).replace("T", " ");
  }
  return "";
}

function minutesBetween(startValue, endValue) {
  const start = new Date(textDateTime(startValue).replace(" ", "T"));
  const end = new Date(textDateTime(endValue).replace(" ", "T"));
  return Math.max(0, Math.round((end - start) / 60000));
}

export function formatMinutes(minutes) {
  const value = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(value / 60);
  const remainder = value % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}

function durationMinutes(value) {
  if (typeof value === "number") return value;
  const text = String(value || "").toLowerCase();
  const hours = Number(text.match(/([\d.]+)\s*h/)?.[1] || 0);
  const minutes = Number(text.match(/([\d.]+)\s*m/)?.[1] || 0);
  return hours * 60 + minutes;
}

function localDateTime(date, time) {
  const [hour = "00", minute = "00"] = String(time || "00:00").split(":");
  return `${date} ${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:00`;
}

function endDateTime(date, time, duration) {
  const start = new Date(`${localDateTime(date, time).replace(" ", "T")}`);
  start.setMinutes(start.getMinutes() + durationMinutes(duration));
  return `${getLocalDateISO(start)} ${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}:${String(start.getSeconds()).padStart(2, "0")}`;
}

function resultRows(response) {
  return Array.isArray(response?.data) ? response.data : [];
}

function mapActivities(rows, categories, locations) {
  const categoryNames = new Map(categories.map((item) => [item.category_id, item.category_name]));
  const locationNames = new Map(locations.map((item) => [item.location_id, item.location_name]));
  return rows.map((row) => ({
    id: row.activity_id,
    name: row.activity_name,
    category: categoryNames.get(row.category_id) || "Uncategorized",
    category_id: row.category_id,
    location: locationNames.get(row.location_id) || "Unspecified",
    location_id: row.location_id,
    date: textDate(row.log_date),
    time: textDateTime(row.start_time).slice(11, 16),
    end: textDateTime(row.end_time).slice(11, 16),
    duration: formatMinutes(minutesBetween(row.start_time, row.end_time)),
    description: row.description || "",
  }));
}

function mapExpenses(rows) {
  return rows.map((row) => ({
    id: row.expense_id,
    category: row.category,
    amount: Number(row.amount),
    method: row.payment_method || "",
    description: row.description || "",
    dateISO: textDate(row.log_date),
  }));
}

function mapStudy(rows) {
  return rows.map((row) => ({
    id: row.study_id,
    subject: row.subject,
    topic: row.topic || "",
    dateISO: textDate(row.log_date),
    duration: formatMinutes(minutesBetween(row.start_time, row.end_time)),
    rating: Number(row.productivity_rating) || 0,
    start_time: textDateTime(row.start_time),
    end_time: textDateTime(row.end_time),
  }));
}

function mapFood(rows) {
  return rows.map((row) => ({ ...row, id: row.food_id, dateISO: textDate(row.log_date), cost: Number(row.cost || 0) }));
}

function mapTransport(rows) {
  return rows.map((row) => ({
    id: row.transport_id,
    mode: row.mode,
    source: row.source_location || "",
    destination: row.destination_location || "",
    distance: Number(row.distance_km || 0),
    duration: Number(row.duration_minutes || 0),
    cost: Number(row.cost || 0),
    dateISO: textDate(row.log_date),
  }));
}

function mapScreenTime(rows) {
  return rows.map((row) => ({ ...row, id: row.screen_id, dateISO: textDate(row.log_date) }));
}

function mapMoodSleep(moodRows, sleepRows) {
  const dates = new Map();
  for (const row of moodRows) {
    const dateISO = textDate(row.log_date);
    const entry = dates.get(dateISO) || { id: `day-${dateISO}`, dateISO };
    if (entry.mood_id === undefined) {
      entry.mood_id = row.mood_id;
      entry.mood = row.mood;
      entry.moodScore = Number(row.mood_score);
    }
    dates.set(dateISO, entry);
  }
  for (const row of sleepRows) {
    const dateISO = textDate(row.log_date);
    const entry = dates.get(dateISO) || { id: `day-${dateISO}`, dateISO };
    if (entry.sleep_id === undefined) {
      entry.sleep_id = row.sleep_id;
      entry.sleepHours = Number((minutesBetween(row.sleep_start, row.sleep_end) / 60).toFixed(2));
      entry.quality = Number(row.quality_score) || 0;
    }
    dates.set(dateISO, entry);
  }
  return [...dates.values()].sort((left, right) => right.dateISO.localeCompare(left.dateISO));
}

function mapGoals(rows, progressRows) {
  const progressById = new Map(progressRows.map((item) => [item.goalId, item]));
  return rows.map((row) => {
    const progress = progressById.get(row.goal_id);
    const current = Number(progress?.currentValue || 0);
    return {
      id: row.goal_id,
      name: row.goal_name,
      type: row.goal_type || "General",
      current,
      target: Number(row.target_value || 0),
      unit: row.unit || "",
      deadline: textDate(row.end_date) || "",
      startDate: textDate(row.start_date) || "",
      status: row.status,
      progressDate: progress?.currentProgressDate || "",
      progressPercent: progress?.progressPercent ?? 0,
    };
  });
}

function createGoalBody(item) {
  const startDate = item.startDate || getLocalDateISO();
  const rawStatus = item.status === "Completed" ? "Completed" : "Active";
  return {
    goal_name: item.name,
    goal_type: item.type || null,
    target_value: item.target === "" ? null : Number(item.target),
    unit: item.unit || null,
    start_date: startDate,
    end_date: item.deadline || null,
    status: rawStatus,
  };
}

const Ctx = createContext(null);

export function LifeLogProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState(emptyData);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchGoals() {
    const [goalsResponse, progressResponse] = await Promise.all([
      api.goals.list(),
      api.getProgress({ date: getLocalDateISO(), range: "month" }),
    ]);
    return mapGoals(resultRows(goalsResponse), progressResponse.goals || []);
  }

  async function fetchResource(key, refs = { categories, locations }) {
    if (key === "activities") return mapActivities(resultRows(await api.activities.list()), refs.categories, refs.locations);
    if (key === "expenses") return mapExpenses(resultRows(await api.expenses.list()));
    if (key === "studySessions") return mapStudy(resultRows(await api.studySessions.list()));
    if (key === "food") return mapFood(resultRows(await api.foodLogs.list()));
    if (key === "transport") return mapTransport(resultRows(await api.transportLogs.list()));
    if (key === "screenTime") return mapScreenTime(resultRows(await api.screenTime.list()));
    if (key === "moodSleep") {
      const [moods, sleep] = await Promise.all([api.moodLogs.list(), api.sleepLogs.list()]);
      return mapMoodSleep(resultRows(moods), resultRows(sleep));
    }
    if (key === "goals") return fetchGoals();
    return [];
  }

  async function fetchAll() {
    const [categoryResponse, locationResponse] = await Promise.all([api.getCategories(), api.getLocations()]);
    const refs = { categories: resultRows(categoryResponse), locations: resultRows(locationResponse) };
    const keys = Object.keys(emptyData);
    const values = await Promise.all(keys.map((key) => fetchResource(key, refs)));
    setCategories(refs.categories);
    setLocations(refs.locations);
    setData(Object.fromEntries(keys.map((key, index) => [key, values[index]])));
  }

  useEffect(() => {
    let active = true;
    if (!user) {
      setData(emptyData);
      setCategories([]);
      setLocations([]);
      setError("");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    fetchAll()
      .then(() => { if (active) setError(""); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user?.id]);

  async function refresh() {
    if (!user) return false;
    setLoading(true);
    try {
      await fetchAll();
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function refreshKey(key) {
    try {
      const updated = await fetchResource(key);
      setData((previous) => ({ ...previous, [key]: updated }));
      setError("");
      return true;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    }
  }

  async function add(key, item) {
    try {
      if (key === "activities") {
        const date = item.date || item.dateISO || getLocalDateISO();
        const category = categories.find((entry) => entry.category_name === item.category);
        const location = locations.find((entry) => entry.location_name === item.location);
        await api.activities.create({
          category_id: item.category_id || category?.category_id,
          location_id: item.location_id || location?.location_id || null,
          activity_name: item.name,
          start_time: item.start_time || localDateTime(date, item.time),
          end_time: item.end_time || endDateTime(date, item.time, item.duration),
          description: item.description || null,
          date,
        });
      } else if (key === "expenses") {
        await api.expenses.create({
          date: item.dateISO || item.date || getLocalDateISO(),
          category: item.category,
          amount: Number(item.amount),
          payment_method: item.method || item.payment_method || null,
          description: item.description || null,
        });
      } else if (key === "studySessions") {
        const date = item.dateISO || getLocalDateISO();
        await api.studySessions.create({
          date,
          subject: item.subject,
          topic: item.topic || null,
          start_time: item.start_time || localDateTime(date, item.time || "09:00"),
          end_time: item.end_time || endDateTime(date, item.time || "09:00", item.duration),
          productivity_rating: item.rating === "" ? null : Number(item.rating),
        });
      } else if (key === "food") {
        await api.foodLogs.create({
          date: item.dateISO || getLocalDateISO(),
          meal_type: item.meal_type,
          food_name: item.food_name,
          quantity: item.quantity || null,
          calories: item.calories === "" ? null : Number(item.calories),
          cost: item.cost === "" ? null : Number(item.cost),
        });
      } else if (key === "transport") {
        await api.transportLogs.create({
          date: item.dateISO || getLocalDateISO(),
          mode: item.mode,
          source_location: item.source || item.source_location || null,
          destination_location: item.destination || item.destination_location || null,
          distance_km: item.distance === "" ? null : Number(item.distance),
          duration_minutes: item.duration === "" ? null : Number(item.duration),
          cost: item.cost === "" ? null : Number(item.cost),
        });
      } else if (key === "screenTime") {
        await api.screenTime.create({
          date: item.dateISO || getLocalDateISO(),
          application_name: item.application_name,
          category: item.category || null,
          duration_minutes: Number(item.duration_minutes),
        });
      } else if (key === "moodSleep") {
        const date = item.dateISO || getLocalDateISO();
        await Promise.all([
          api.moodLogs.create({ date, mood: item.mood, mood_score: Number(item.moodScore), reason: item.reason || null }),
          api.sleepLogs.create({
            date,
            sleep_start: localDateTime(date, item.sleepStart || "23:00"),
            sleep_end: endDateTime(date, item.sleepStart || "00:00", Number(item.sleepHours) * 60),
            quality_score: Number(item.quality),
          }),
        ]);
      } else if (key === "goals") {
        const response = await api.goals.create(createGoalBody(item));
        if (Number(item.current) > 0) {
          await api.goals.addProgress(response.data.goal_id, {
            progress_date: item.progressDate || getLocalDateISO(),
            actual_value: Number(item.current),
          });
        }
      }
      return await refreshKey(key).then((ok) => ok ? { ok: true } : { ok: false });
    } catch (requestError) {
      await refreshKey(key);
      setError(requestError.message);
      return { ok: false, message: requestError.message };
    }
  }

  async function update(key, id, patch) {
    try {
      const current = data[key]?.find((item) => item.id === id);
      if (!current) throw new Error("Record not found.");
      const item = { ...current, ...patch };
      if (key === "activities") {
        const date = item.date || getLocalDateISO();
        const category = categories.find((entry) => entry.category_name === item.category);
        const location = locations.find((entry) => entry.location_name === item.location);
        await api.activities.update(id, {
          category_id: item.category_id || category?.category_id,
          location_id: item.location_id || location?.location_id || null,
          activity_name: item.name,
          start_time: item.start_time || localDateTime(date, item.time),
          end_time: item.end_time || endDateTime(date, item.time, item.duration),
          description: item.description || null,
          date,
        });
      } else if (key === "expenses") {
        await api.expenses.update(id, {
          category: item.category,
          amount: Number(item.amount),
          payment_method: item.method || null,
          description: item.description || null,
          date: item.dateISO,
        });
      } else if (key === "goals") {
        await api.goals.update(id, createGoalBody(item));
      } else {
        throw new Error("This record cannot be edited here.");
      }
      return await refreshKey(key).then((ok) => ok ? { ok: true } : { ok: false });
    } catch (requestError) {
      await refreshKey(key);
      setError(requestError.message);
      return { ok: false, message: requestError.message };
    }
  }

  async function remove(key, id) {
    try {
      if (key === "activities") await api.activities.remove(id);
      else if (key === "expenses") await api.expenses.remove(id);
      else if (key === "studySessions") await api.studySessions.remove(id);
      else if (key === "food") await api.foodLogs.remove(id);
      else if (key === "transport") await api.transportLogs.remove(id);
      else if (key === "screenTime") await api.screenTime.remove(id);
      else if (key === "moodSleep") {
        const entry = data.moodSleep.find((item) => item.id === id);
        await Promise.all([
          entry?.mood_id ? api.moodLogs.remove(entry.mood_id) : Promise.resolve(),
          entry?.sleep_id ? api.sleepLogs.remove(entry.sleep_id) : Promise.resolve(),
        ]);
      } else if (key === "goals") await api.goals.remove(id);
      return await refreshKey(key).then((ok) => ok ? { ok: true } : { ok: false });
    } catch (requestError) {
      await refreshKey(key);
      setError(requestError.message);
      return { ok: false, message: requestError.message };
    }
  }

  async function addGoalProgress(goalId, progressDate, actualValue) {
    try {
      const progress = resultRows(await api.goals.progress(goalId));
      const currentEntry = progress.find((entry) => entry.progress_date === progressDate);
      const body = { actual_value: Number(actualValue) };
      if (currentEntry) await api.goals.updateProgress(goalId, progressDate, body);
      else await api.goals.addProgress(goalId, { progress_date: progressDate, ...body });
      return await refreshKey("goals").then((ok) => ok ? { ok: true } : { ok: false });
    } catch (requestError) {
      await refreshKey("goals");
      setError(requestError.message);
      return { ok: false, message: requestError.message };
    }
  }

  async function getDailyLog(date) {
    try {
      const response = await api.getDailyLog(date);
      setError("");
      return { ok: true, data: response.data };
    } catch (requestError) {
      setError(requestError.message);
      return { ok: false, message: requestError.message };
    }
  }

  async function updateDailyLog(date, notes) {
    try {
      const response = await api.updateDailyLog(date, { notes });
      setError("");
      return { ok: true, data: response.data };
    } catch (requestError) {
      setError(requestError.message);
      return { ok: false, message: requestError.message };
    }
  }

  function clearError() {
    setError("");
  }

  const value = useMemo(() => ({
    ...data,
    categories,
    locations,
    loading,
    error,
    clearError,
    refresh,
    add,
    remove,
    update,
    addGoalProgress,
    getDailyLog,
    updateDailyLog,
    defaultDate: getLocalDateISO(),
  }), [data, categories, locations, loading, error, user?.id]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLifeLog() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useLifeLog must be used inside LifeLogProvider");
  return value;
}

export function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export function dateLabel(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));
}

export function parseDuration(value) {
  return durationMinutes(value);
}
