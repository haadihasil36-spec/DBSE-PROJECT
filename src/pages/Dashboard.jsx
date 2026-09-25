import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, CalendarDays, ChevronRight, CircleAlert, Clock3, Plus, Sparkles, Target, Zap } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { kpis, weeklyStudy, weeklySpend, timeDistribution, insights, timeline } from "../data/mockData";
import { SectionTitle, StatCard, Badge } from "../components/UI";

const quickActions = [
  ["Activity", "/activities", ActivityIcon], ["Study", "/study", StudyIcon], ["Expense", "/expenses", ExpenseIcon], ["Goal", "/goals", GoalIcon]
];
function ActivityIcon({size=17}) { return <Zap size={size}/>; }
function StudyIcon({size=17}) { return <span className="text-[13px] font-black">S</span>; }
function ExpenseIcon({size=17}) { return <span className="text-[13px] font-black">₹</span>; }
function GoalIcon({size=17}) { return <Target size={size}/>; }

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("7 days");
  return <div className="space-y-6">
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

    <div className="flex items-end justify-between gap-3"><div><p className="section-kicker">Snapshot</p><h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Today at a glance</h2></div><select className="input w-auto bg-white" value={range} onChange={e => setRange(e.target.value)}><option>7 days</option><option>30 days</option><option>This month</option></select></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{kpis.map(x => <StatCard key={x.label} {...x}/>)}</div>

    <div className="mt-2 grid gap-6 xl:grid-cols-3">
      <div className="card p-5 xl:col-span-2">
        <SectionTitle action={<button onClick={() => navigate("/progress")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View progress <ArrowUpRight size={13} className="inline"/></button>}>Study rhythm</SectionTitle>
        <p className="-mt-2 mb-3 text-xs text-slate-400">Hours focused across the last seven days</p>
        <div className="h-72"><ResponsiveContainer><BarChart data={weeklyStudy}><CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><Tooltip cursor={{fill:"rgba(99,102,241,.06)"}} contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",boxShadow:"0 10px 25px rgba(15,23,42,.08)"}}/><Bar dataKey="hours" radius={[8,8,3,3]} fill="#6366f1"/></BarChart></ResponsiveContainer></div>
      </div>
      <div className="card p-5">
        <SectionTitle>Time fingerprint</SectionTitle><p className="-mt-2 text-xs text-slate-400">How your week is distributed</p>
        <div className="h-56"><ResponsiveContainer><PieChart><Pie data={timeDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} fill="#6366f1"/></PieChart></ResponsiveContainer></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">{timeDistribution.map((x,i)=><div key={x.name} className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-500"><span className="h-2 w-2 rounded-full bg-indigo-400"/>{x.name}</span><b>{x.value}%</b></div>)}</div>
      </div>
    </div>

    <div className="grid gap-6 lg:grid-cols-5">
      <div className="card p-5 lg:col-span-3"><SectionTitle>Spending pulse</SectionTitle><p className="-mt-2 mb-2 text-xs text-slate-400">Daily spending for the current week</p><div className="h-60"><ResponsiveContainer><LineChart data={weeklySpend}><CartesianGrid vertical={false} stroke="#eef2f7" strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><YAxis tickLine={false} axisLine={false} tick={{fontSize:11,fill:"#94a3b8"}}/><Tooltip formatter={(v)=>[`₹${v}`,"Spend"]} contentStyle={{borderRadius:12,border:"1px solid #e2e8f0"}}/><Line type="monotone" dataKey="amount" stroke="#8b5cf6" strokeWidth={3} dot={{r:3,fill:"#8b5cf6"}} activeDot={{r:6}}/></LineChart></ResponsiveContainer></div></div>
      <div className="card p-5 lg:col-span-2"><SectionTitle>LifeLog Insights</SectionTitle><div className="space-y-3">{insights.map((x)=><div key={x.title} className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-3.5"><div className="flex gap-3"><div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-600"><Sparkles size={14}/></div><div><p className="text-sm font-bold text-slate-800">{x.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{x.text}</p></div></div></div>)}</div></div>
    </div>

    <div className="card p-5"><SectionTitle action={<button onClick={() => navigate("/timeline")} className="text-xs font-semibold text-indigo-600">Full timeline <ChevronRight size={14} className="inline"/></button>}>Today's timeline</SectionTitle><div className="grid gap-2">{timeline.slice(0,5).map((x,i)=><div key={i} className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-indigo-50/60"><div className="w-20 text-xs font-semibold text-slate-500">{x.time}</div><div className="h-9 w-1 rounded-full bg-gradient-to-b from-indigo-400 to-violet-400"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{x.name}</p><p className="text-xs text-slate-400">{x.location} · {x.duration}</p></div><Badge tone={x.category==="Study"?"blue":x.category==="Exercise"?"green":"slate"}>{x.category}</Badge></div>)}</div></div>
  </div>;
}
