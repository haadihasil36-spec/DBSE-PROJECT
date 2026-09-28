import { useEffect, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, CircleDollarSign, Moon, Smartphone, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SectionTitle, StatCard } from "../components/UI";
import RequestStatus from "../components/RequestStatus";
import { api } from "../services/api";
import { dateLabel, getLocalDateISO } from "../data/LifeLogContext";
import { useLifeLog } from "../data/LifeLogContext";

function minsToText(mins) { const h = Math.floor(mins/60), m = Math.round(mins%60); return h ? `${h}h ${m}m` : `${m}m`; }

export default function Progress() {
  const { clearError } = useLifeLog();
  const [range, setRange] = useState("week");
  const [selectedDate, setSelectedDate] = useState(getLocalDateISO());
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api.getProgress({ date: selectedDate, range }).then((result) => {
      if (active) {
        setProgress(result);
        setError("");
      }
    }).catch((requestError) => {
      if (active) setError(requestError.message);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [selectedDate, range]);

  const summary = progress?.summary || {};
  const weekly = (progress?.study?.byDay || []).map((row) => ({
    ...row,
    day: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(`${row.date}T12:00:00`)),
    spend: 0,
  }));
  const studyMinutes = Number(summary.studyHours || 0) * 60;
  const activityMinutes = Number(summary.activityHours || 0) * 60;
  const goals = progress?.goals || [];

  return <div>
    <PageHeader title="Daily & Weekly Progress" description="Track your progress for one day or compare your whole week." icon={TrendingUp}/>
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex rounded-xl bg-slate-100 p-1">{[["day","Daily"],["week","Weekly"],["month","Monthly"]].map(([key,label])=><button key={key} onClick={()=>setRange(key)} className={`rounded-lg px-4 py-2 text-sm font-semibold ${range===key?"bg-white shadow-sm text-slate-900":"text-slate-500"}`}>{label}</button>)}</div>
      <div className="flex items-center gap-2"><CalendarDays size={17} className="text-slate-400"/><input className="input w-auto" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></div>
    </div>
    <RequestStatus loading={loading} error={error} onDismiss={() => { setError(""); clearError(); }}/>
    <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{range === "day" ? "Selected day" : range === "week" ? "Week range" : "Month range"}</p><h2 className="mt-1 text-xl font-bold">{dateLabel(progress?.range?.from || selectedDate)}{progress?.range?.to && progress.range.to !== progress.range.from ? ` – ${dateLabel(progress.range.to)}` : ""}</h2></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Study" value={`${Number(summary.studyHours || 0).toFixed(1)}h`} change={`${summary.studySessions || 0} sessions`} icon="BookOpen" tone="blue"/>
      <StatCard label="Activities" value={summary.activityCount || 0} change={`${Number(summary.activityHours || 0).toFixed(1)}h logged`} icon="Activity" tone="violet"/>
      <StatCard label="Spending" value={`₹${Number(summary.spending || 0).toFixed(2)}`} change="selected range" icon="CircleDollarSign" tone="emerald"/>
      <StatCard label="Screen time" value={minsToText(summary.screenTimeMinutes || 0)} change="selected range" icon="Smartphone" tone="amber"/>
      <StatCard label="Productivity" value={summary.averageProductivity == null ? "—" : `${summary.averageProductivity}/5`} change={`${summary.ratedStudySessions || 0} rated sessions`} icon="TrendingUp" tone="rose"/>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="card p-5"><SectionTitle>Goal progress</SectionTitle><div className="space-y-4">{goals.map((goal) => <div key={goal.goalId}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-semibold">{goal.goalName}</span><span className="text-slate-500">{goal.currentValue ?? 0} / {goal.targetValue ?? "—"} {goal.unit}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{ width: `${Math.min(100, goal.progressPercent || 0)}%` }}/></div></div>)}{!goals.length&&<p className="py-5 text-sm text-slate-400">No goals for this account yet.</p>}</div></div>
      <div className="card p-5"><SectionTitle>Budget progress</SectionTitle><div className="space-y-4">{progress?.budgetGoals?.map((goal) => <div key={goal.goalId}><div className="mb-2 flex justify-between gap-3 text-sm"><span className="font-semibold">{goal.goalName}</span><span className="text-slate-500">₹{Number(goal.spentAmount).toFixed(2)} / ₹{goal.targetAmount ?? "—"}</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, goal.spentPercent || 0)}%` }}/></div></div>)}{!progress?.budgetGoals?.length&&<p className="py-5 text-sm text-slate-400">No budget goals in this range.</p>}</div></div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="card p-5"><SectionTitle>Study progression</SectionTitle><div className="h-72">{weekly.length ? <ResponsiveContainer><BarChart data={weekly}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip formatter={(value) => [`${Number(value).toFixed(1)} h`, "Study"]}/><Bar dataKey="hours" fill="#0f172a" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer> : <p className="grid h-full place-items-center text-sm text-slate-400">No study sessions in this range.</p>}</div></div>
      <div className="card p-5"><SectionTitle>Activity progress</SectionTitle><div className="space-y-5">{[["Study time",studyMinutes,300,BookOpen],["Activity time",activityMinutes,480,Target],["Screen time",Number(summary.screenTimeMinutes||0),240,Smartphone]].map(([label,value,target,Icon])=>{const pct=Math.min(100,Math.round(value/target*100));return <div key={label}><div className="mb-2 flex justify-between text-sm"><span className="flex items-center gap-2 font-semibold"><Icon size={15}/>{label}</span><span className="text-slate-500">{minsToText(value)} · {pct}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{width:`${pct}%`}}/></div></div>})}</div></div>
    </div>
    <div className="mt-6 card p-5"><SectionTitle>Activity by category</SectionTitle><div className="overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Category</th><th>Activities</th><th>Hours</th></tr></thead><tbody className="divide-y divide-slate-100">{progress?.activity?.byCategory?.map((row)=><tr key={row.category}><td className="px-4 py-3 font-semibold">{row.category}</td><td>{row.activityCount}</td><td>{Number(row.hours).toFixed(1)}</td></tr>)}</tbody></table>{!progress?.activity?.byCategory?.length&&<p className="py-5 text-center text-sm text-slate-400">No activities in this range.</p>}</div></div>
  </div>
}
