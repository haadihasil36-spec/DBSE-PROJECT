export const user = {
  id: 1,
  name: "Rahul Sharma",
  email: "rahul@lifelog.com",
};

export const kpis = [
  { label: "Sleep", value: "7h 20m", change: "+18m", tone: "indigo", icon: "Moon" },
  { label: "Study", value: "4h 35m", change: "+12%", tone: "blue", icon: "BookOpen" },
  { label: "Spending", value: "₹1,840", change: "-8%", tone: "emerald", icon: "Wallet" },
  { label: "Screen time", value: "3h 42m", change: "-24m", tone: "amber", icon: "Smartphone" },
  { label: "Mood", value: "8.1 / 10", change: "+0.7", tone: "rose", icon: "Smile" },
  { label: "Activity", value: "7h 10m", change: "+9%", tone: "violet", icon: "Activity" },
];

export const weeklyStudy = [
  { day: "Mon", hours: 2.4 }, { day: "Tue", hours: 3.1 }, { day: "Wed", hours: 1.8 },
  { day: "Thu", hours: 4.2 }, { day: "Fri", hours: 3.4 }, { day: "Sat", hours: 5.1 },
  { day: "Sun", hours: 2.9 },
];

export const weeklySpend = [
  { day: "Mon", amount: 280 }, { day: "Tue", amount: 420 }, { day: "Wed", amount: 180 },
  { day: "Thu", amount: 310 }, { day: "Fri", amount: 220 }, { day: "Sat", amount: 690 },
  { day: "Sun", amount: 340 },
];

export const timeDistribution = [
  { name: "Study", value: 29 },
  { name: "Work", value: 18 },
  { name: "Travel", value: 12 },
  { name: "Exercise", value: 9 },
  { name: "Entertainment", value: 17 },
  { name: "Personal", value: 15 },
];

export const screenTime = [
  { app: "YouTube", minutes: 74 },
  { app: "WhatsApp", minutes: 52 },
  { app: "Chrome", minutes: 46 },
  { app: "Instagram", minutes: 38 },
  { app: "VS Code", minutes: 31 },
  { app: "Netflix", minutes: 21 },
];

export const timeline = [
  { time: "07:00", end: "07:30", name: "Morning routine", category: "Personal", location: "Home", duration: "30m" },
  { time: "08:10", end: "08:45", name: "Travel to college", category: "Travel", location: "Bus", duration: "35m" },
  { time: "09:00", end: "11:00", name: "DBSE Preparation", category: "Study", location: "College", duration: "2h" },
  { time: "11:20", end: "12:10", name: "College Classes", category: "Study", location: "College", duration: "50m" },
  { time: "13:00", end: "13:35", name: "Lunch", category: "Personal", location: "Canteen", duration: "35m" },
  { time: "16:30", end: "17:20", name: "Gym Workout", category: "Exercise", location: "Gym", duration: "50m" },
  { time: "18:00", end: "19:30", name: "SQL Practice", category: "Study", location: "Library", duration: "1h 30m" },
  { time: "20:00", end: "22:00", name: "Friends Meetup", category: "Social", location: "Cafe", duration: "2h" },
];

export const expenses = [
  { id: 1, date: "Sep 07", category: "Food", description: "Dinner", method: "UPI", amount: 320 },
  { id: 2, date: "Sep 07", category: "Travel", description: "Bus pass", method: "UPI", amount: 80 },
  { id: 3, date: "Sep 06", category: "Education", description: "DBSE notes", method: "Cash", amount: 250 },
  { id: 4, date: "Sep 06", category: "Entertainment", description: "Movie", method: "Card", amount: 420 },
  { id: 5, date: "Sep 05", category: "Food", description: "Lunch", method: "UPI", amount: 180 },
  { id: 6, date: "Sep 04", category: "Travel", description: "Auto", method: "UPI", amount: 110 },
];

export const studySessions = [
  { subject: "DBSE", topic: "Normalization", date: "Sep 07", duration: "2h", rating: 5 },
  { subject: "DBMS", topic: "Transactions", date: "Sep 06", duration: "1h 30m", rating: 4 },
  { subject: "Java", topic: "Collections", date: "Sep 05", duration: "45m", rating: 4 },
  { subject: "DBSE", topic: "SQL Queries", date: "Sep 04", duration: "1h 20m", rating: 5 },
];

export const food = [];

export const goals = [
  { id: 1, name: "Study 30 hours", type: "Study", current: 22.5, target: 30, unit: "hours", deadline: "Sep 30", status: "On track" },
  { id: 2, name: "Exercise 15 days", type: "Exercise", current: 9, target: 15, unit: "days", deadline: "Sep 30", status: "On track" },
  { id: 3, name: "Monthly budget", type: "Budget", current: 1840, target: 5000, unit: "₹", deadline: "Sep 30", status: "Safe" },
];

export const insights = [
  { title: "Best productivity day", text: "Saturday was your strongest study day with 5.1 hours logged.", icon: "Sparkles" },
  { title: "Sleep → productivity", text: "Your highest productivity scores happened after 7+ hours of sleep.", icon: "TrendingUp" },
  { title: "Spending alert", text: "Food represents 47% of your spending this week.", icon: "CircleAlert" },
];
