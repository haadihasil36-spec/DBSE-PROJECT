import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, CalendarDays, ChevronRight, Clock3, Plus, Sparkles, Target, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SectionTitle, StatCard, Badge } from "../components/UI";
import RequestStatus from "../components/RequestStatus";
import { api } from "../services/api";
import { getLocalDateISO } from "../data/LifeLogContext";
import { useLifeLog } from "../data/LifeLogContext";

const chartColors = ["#0f766e", "#6366f1", "#e8793f", "#0ea5e9", "#84a34a", "#db5b76"];

function offsetDate(date, offset) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}

function dayName(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(`${date}T12:00:00`));
}

function insightText(insight) {
  if (insight.key === "sleepStudyCorrelation" || insight.key === "sleepProductivityCorrelation") {
    return insight.value === null ? "Not enough overlapping sleep and activity data yet." : `Correlation ${insight.value} across ${insight.sampleDays} days.`;
  }
  if (insight.percentage !== undefined && insight.percentage !== null) return `${insight.value || "No records"} · ${insight.percentage}% of the total.`;
  if (insight.metric !== undefined && insight.metric !== null) return `${insight.value} · ${insight.metric} ${insight.unit || ""}.`;
  return insight.value ?? "No records in this period yet.";
}

const quickActions = [
  ["Activity", "/activities", ActivityIcon], ["Study", "/study", StudyIcon], ["Expense", "/expenses", ExpenseIcon], ["Goal", "/goals", GoalIcon]
];
function ActivityIcon({size=17}) { return <Zap size={size}/>; }
function StudyIcon({size=17}) { return <span className="text-[13px] font-black">S</span>; }
function ExpenseIcon({size=17}) { return <span className="text-[13px] font-black">₹</span>; }
function GoalIcon({size=17}) { return <Target size={size}/>; }

export default function Dashboard() {
  const navigate = useNavigate();
  const { clearError } = useLifeLog();
  const [dashboard, setDashboard] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const today = getLocalDateISO();
    Promise.all([
      api.getDashboard(),
      api.getAnalytics({ from: offsetDate(today, -6), to: today }),
    ]).then(([dashboardResponse, analyticsResponse]) => {
      if (!active) return;
      setDashboard(dashboardResponse);
      setAnalytics(analyticsResponse);
      setError("");
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const today = dashboard?.summary?.today;
  const weeklyStudy = (dashboard?.charts?.weeklyStudyHours || []).map((row) => ({ ...row, day: dayName(row.date) }));
  const weeklySpend = (dashboard?.charts?.weeklySpending || []).map((row) => ({ ...row, day: dayName(row.date) }));
  const timeDistribution = (analytics?.charts?.activityByCategory || []).map((row) => ({ name: row.category, value: row.percentage }));
  const insights = analytics?.insights || [];
  const recentActivities = dashboard?.recentActivities || [];
  const recentExpenses = dashboard?.recentExpenses || [];

  return <div className="space-y-6">
    <RequestStatus loading={loading} error={error} onDismiss={() => { setError(""); clearError(); }}/>
    <section className="dashboard-hero">
      <div className="hero-chip"><Sparkles size={13}/> Personal activity intelligence</div>
      <div className="hero-title">Your day, your data,<br/>your patterns.</div>
      <p className="hero-copy">See where your time goes, what keeps you productive, and how your daily choices build toward your goals.</p>
      <div className="hero-actions">
        <button className="hero-action" onClick={() => navigate("/progress")}><CalendarDays size={15}/> View progress</button>
        <button className="hero-action secondary" onClick={() => navigate("/timeline")}><Clock3 size={15}/> Today's timeline</button>
      </div>
    </section>

    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {quickActions.map(([label,path,Icon]) => <button key={label} onClick={() => navigate(path)} className="quick-add-card flex items-center justify-between rounded-2xl p-3.5 text-left shadow-[0_5px_18px_rgba(15,23,42,.035)] transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-[0_12px_26px_rgba(79,70,229,.08)]"><span className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600"><Icon/></span><span><b className="block text-xs text-slate-800">Log {label}</b><small className="text-[10px] text-slate-400">Add to your day</small></span></span><Plus size={15} className="text-slate-400"/></button>)}
    </div>

    <div className="flex items-end justify-between gap-3"><div><p className="section-kicker">Snapshot</p><h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Today at a glance</h2></div><span className="text-xs font-medium text-slate-400">{today?.date || getLocalDateISO()}</span></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <StatCard label="Activities" value={today?.activityCount ?? "—"} change="logged today" icon="Activity" tone="blue"/>
      <StatCard label="Study" value={`${today?.studyHours ?? 0}h`} change="focused today" icon="BookOpen" tone="violet"/>
      <StatCard label="Spending" value={`₹${Number(today?.spending || 0).toFixed(2)}`} change="today" icon="Wallet" tone="emerald"/>
      <StatCard label="Screen time" value={`${today?.screenTimeMinutes ?? 0}m`} change="today" icon="Smartphone" tone="amber"/>
      <StatCard label="Mood" value={today?.moodScore ?? "—"} change="out of 10" icon="HeartPulse" tone="rose"/>
      <StatCard label="Sleep" value={today?.latestSleep ? `${today.latestSleep.durationHours}h` : "—"} change={today?.latestSleep ? `${today.latestSleep.qualityScore}/5 quality` : "No sleep logged"} icon="Moon" tone="indigo"/>
    </div>

    <div className="mt-2 grid gap-6 xl:grid-cols-3">
      <div className="card p-5 xl:col-span-2">
        <SectionTitle action={<button onClick={() => navigate("/progress")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View progress <ArrowUpRight size={13} className="inline"/></button>}>Study rhythm</SectionTitle>
        <p className="-mt-2 mb-3 text-xs text-slate-400">Hours focused across the last seven days</p>
        <div className="h-72"><ResponsiveContainer><BarChart data={weeklyStudy}><CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><Tooltip cursor={{fill:"rgba(99,102,241,.06)"}} contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",boxShadow:"0 10px 25px rgba(15,23,42,.08)"}}/><Bar dataKey="hours" radius={[8,8,3,3]} fill="#6366f1"/></BarChart></ResponsiveContainer></div>
      </div>
      <div className="card p-5">
        <SectionTitle>Time fingerprint</SectionTitle><p className="-mt-2 text-xs text-slate-400">How your week is distributed</p>
        <div className="h-56">{timeDistribution.length ? <ResponsiveContainer><PieChart><Pie data={timeDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3}>{timeDistribution.map((entry,index)=><Cell key={entry.name} fill={chartColors[index%chartColors.length]}/>)}</Pie><Tooltip formatter={(value)=>[`${value}%`,"Time share"]}/></PieChart></ResponsiveContainer> : <p className="grid h-full place-items-center text-sm text-slate-400">No activity data yet.</p>}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{timeDistribution.map((x,i)=><div key={x.name} className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full" style={{backgroundColor:chartColors[i%chartColors.length]}}/>{x.name}</span><b>{x.value}%</b></div>)}</div>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card p-5 lg:col-span-3"><SectionTitle>Spending pulse</SectionTitle><p className="-mt-2 mb-2 text-xs text-slate-400">Daily spending for the current week</p><div className="h-60"><ResponsiveContainer><LineChart data={weeklySpend}><CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><Tooltip formatter={(v)=>[`₹${v}`,"Spend"]} contentStyle={{borderRadius:12,border:"1px solid #e2e8f0"}}/><Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{r:3,fill:"#8b5cf6"}} activeDot={{r:6}}/></LineChart></ResponsiveContainer></div></div>
      <div className="card p-5 lg:col-span-2"><SectionTitle>LifeLog Insights</SectionTitle><div className="space-y-3">{insights.slice(0,4).map((x)=><div key={x.key} className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-3.5"><div className="flex gap-3"><div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-600"><Sparkles size={14}/></div><div><p className="text-sm font-bold text-slate-800">{x.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{insightText(x)}</p></div></div></div>)}{!insights.length&&<p className="text-sm text-slate-400">Insights will appear as more data is logged.</p>}</div></div>
    </div>

    <div className="card p-5"><SectionTitle action={<button onClick={() => navigate("/timeline")} className="text-xs font-semibold text-indigo-600">Full timeline <ChevronRight size={14} className="inline"/></button>}>Recent activities</SectionTitle><div className="grid gap-2">{recentActivities.slice(0,5).map((x)=><div key={x.activity_id} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-indigo-50/60"><div className="w-20 text-xs font-semibold text-slate-500">{String(x.start_time||"").slice(11,16)}</div><div className="h-9 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-violet-400"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{x.activity_name}</p><p className="text-xs text-slate-400">{x.location_name || "Unspecified"} · {x.log_date}</p></div><Badge tone={x.category_name==="Study"?"blue":x.category_name==="Exercise"?"green":"slate"}>{x.category_name}</Badge></div>)}{!recentActivities.length&&<p className="py-5 text-center text-sm text-slate-400">No activities logged yet.</p>}</div></div>

    <div className="card p-5"><SectionTitle action={<button onClick={() => navigate("/expenses")} className="text-xs font-semibold text-indigo-600">All expenses <ChevronRight size={14} className="inline"/></button>}>Recent expenses</SectionTitle><div className="divide-y divide-slate-100">{recentExpenses.map((expense)=><div key={expense.expense_id} className="flex items-center gap-3 py-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">₹</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{expense.description || expense.category}</p><p className="text-xs text-slate-400">{expense.category} · {expense.log_date}</p></div><strong className="text-sm">₹{Number(expense.amount).toFixed(2)}</strong></div>)}{!recentExpenses.length&&<p className="py-5 text-center text-sm text-slate-400">No expenses logged yet.</p>}</div></div>
  </div>;
}
