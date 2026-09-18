import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { expenses as seedExpenses, goals as seedGoals, studySessions as seedStudy, timeline as seedTimeline, screenTime as seedScreenTime, food as seedFood } from "./mockData";

const STORAGE_KEY = "lifelog-local-data-v2";
const DEFAULT_DATE = "2026-09-07";

const seedActivities = seedTimeline.map((x, i) => ({
  id: i + 1,
  date: DEFAULT_DATE,
  name: x.name,
  category: x.category,
  location: x.location,
  time: x.time,
  end: x.end,
  duration: x.duration,
}));

const seedExpenseRows = seedExpenses.map(x => ({ ...x, dateISO: `2026-${x.date.includes("Sep") ? "09" : "09"}-${x.date.match(/\d+/)?.[0]?.padStart(2, "0") || "07"}` }));
const seedStudyRows = seedStudy.map((x, i) => ({ ...x, id: i + 1, dateISO: `2026-09-${x.date.match(/\d+/)?.[0]?.padStart(2, "0") || "07"}` }));

const initial = {
  activities: seedActivities,
  expenses: seedExpenseRows,
  studySessions: seedStudyRows,
  food: seedFood.map((x, i) => ({ ...x, id: i + 1 })),
  transport: [
    { id: 1, dateISO: DEFAULT_DATE, mode: "Bus", source: "Home", destination: "College", distance: 8.4, duration: 35, cost: 20 },
    { id: 2, dateISO: "2026-09-06", mode: "Metro", source: "College", destination: "City Center", distance: 11.2, duration: 28, cost: 35 },
    { id: 3, dateISO: "2026-09-05", mode: "Auto", source: "Library", destination: "Home", distance: 5.6, duration: 22, cost: 110 },
    { id: 4, dateISO: "2026-09-04", mode: "Cab", source: "Home", destination: "Cafe", distance: 7.1, duration: 25, cost: 220 },
  ],
  screenTime: seedScreenTime.map((x, i) => ({ id: i + 1, dateISO: DEFAULT_DATE, application_name: x.app, category: x.app === "WhatsApp" || x.app === "Instagram" ? "Social" : "Productivity", duration_minutes: x.minutes })),
  moodSleep: [
    { id: 1, dateISO: "2026-09-01", mood: "Good", moodScore: 7.4, sleepHours: 7.1, quality: 4 },
    { id: 2, dateISO: "2026-09-02", mood: "Okay", moodScore: 6.8, sleepHours: 6.4, quality: 3 },
    { id: 3, dateISO: "2026-09-03", mood: "Great", moodScore: 8.2, sleepHours: 7.7, quality: 5 },
    { id: 4, dateISO: "2026-09-04", mood: "Great", moodScore: 8.1, sleepHours: 7.2, quality: 4 },
    { id: 5, dateISO: "2026-09-05", mood: "Good", moodScore: 7.3, sleepHours: 6.8, quality: 4 },
    { id: 6, dateISO: "2026-09-06", mood: "Excellent", moodScore: 8.8, sleepHours: 8.1, quality: 5 },
    { id: 7, dateISO: DEFAULT_DATE, mood: "Great", moodScore: 8.1, sleepHours: 7.3, quality: 4 },
  ],
  goals: seedGoals.map(x => ({ ...x })),
};

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...initial, ...JSON.parse(saved) } : initial;
  } catch { return initial; }
}

const Ctx = createContext(null);

export function LifeLogProvider({ children }) {
  const [data, setData] = useState(load);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(data)), [data]);

  const add = (key, item) => setData(prev => ({ ...prev, [key]: [{ ...item, id: Date.now() }, ...prev[key]] }));
  const remove = (key, id) => setData(prev => ({ ...prev, [key]: prev[key].filter(x => x.id !== id) }));
  const update = (key, id, patch) => setData(prev => ({ ...prev, [key]: prev[key].map(x => x.id === id ? { ...x, ...patch } : x) }));
  const resetDemo = () => setData(initial);

  const value = useMemo(() => ({ ...data, add, remove, update, resetDemo, defaultDate: DEFAULT_DATE }), [data]);
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
  if (typeof value === "number") return value;
  const s = String(value || "").toLowerCase();
  const h = Number(s.match(/([\d.]+)\s*h/)?.[1] || 0);
  const m = Number(s.match(/([\d.]+)\s*m/)?.[1] || 0);
  return h * 60 + m;
}
