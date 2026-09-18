import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight, BrainCircuit, CalendarDays, ChevronRight, CircleAlert, Clock3, Sparkles, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { kpis, weeklyStudy, weeklySpend, timeDistribution, insights, timeline } from "../data/mockData";
import { SectionTitle, StatCard, Badge } from "../components/UI";

export default function Dashboard() {
  const navigate = useNavigate();
  const [range, setRange] = useState("7 days");
  return <div>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Personal overview</p><h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Your day, your data, your patterns.</h1><p className="mt-2 text-sm text-slate-500">A quick view of how you spent your time and energy.</p></div>
      <select className="input w-auto" value={range} onChange={e => setRange(e.target.value)}><option>7 days</option><option>30 days</option><option>This month</option></select>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{kpis.map(x => <StatCard key={x.label} {...x}/>)}</div>

    <div className="mt-6 grid gap-6 xl:grid-cols-3">
      <div className="card p-5 xl:col-span-2">
        <SectionTitle action={<button onClick={() => navigate("/progress")} className="text-xs font-semibold text-slate-500 hover:text-slate-900">View progress <ArrowUpRight size={13} className="inline"/></button>}>Study hours</SectionTitle>
        <div className="h-72"><ResponsiveContainer><BarChart data={weeklyStudy}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip cursor={{fill:"rgba(148,163,184,.08)"}}/><Bar dataKey="hours" radius={[7,7,0,0]} fill="#0f172a"/></BarChart></ResponsiveContainer></div>
      </div>
      <div className="card p-5">
        <SectionTitle>Time distribution</SectionTitle>
        <div className="h-56"><ResponsiveContainer><PieChart><Pie data={timeDistribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={82} paddingAngle={3} fill="#0f172a"/><Tooltip/></PieChart></ResponsiveContainer></div>
        <div className="grid grid-cols-2 gap-2 text-xs">{timeDistribution.map((x,i)=><div key={x.name} className="flex justify-between"><span className="text-slate-500">{x.name}</span><b>{x.value}%</b></div>)}</div>
      </div>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-5">
      <div className="card p-5 lg:col-span-3">
        <SectionTitle>Weekly spending</SectionTitle>
        <div className="h-60"><ResponsiveContainer><LineChart data={weeklySpend}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip formatter={(v)=>[`₹${v}`,"Spend"]}/><Line type="monotone" dataKey="amount" stroke="#0f172a" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></div>
      </div>
      <div className="card p-5 lg:col-span-2">
        <SectionTitle>LifeLog Insights</SectionTitle>
        <div className="space-y-3">{insights.map((x,i)=><div key={x.title} className="rounded-xl border border-slate-100 bg-slate-50 p-3.5"><div className="flex gap-3"><div className="mt-0.5 text-slate-600"><Sparkles size={16}/></div><div><p className="text-sm font-bold">{x.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{x.text}</p></div></div></div>)}</div>
      </div>
    </div>

    <div className="mt-6 card p-5">
      <SectionTitle action={<button onClick={() => navigate("/timeline")} className="text-xs font-semibold text-slate-500">Full timeline <ChevronRight size={14} className="inline"/></button>}>Today's timeline</SectionTitle>
      <div className="grid gap-2">{timeline.slice(0,5).map((x,i)=><div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50"><div className="w-20 text-xs font-semibold text-slate-500">{x.time}</div><div className="h-9 w-1 rounded-full bg-slate-200"/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{x.name}</p><p className="text-xs text-slate-400">{x.location} · {x.duration}</p></div><Badge tone={x.category==="Study"?"blue":x.category==="Exercise"?"green":"slate"}>{x.category}</Badge></div>)}</div>
    </div>
  </div>
}