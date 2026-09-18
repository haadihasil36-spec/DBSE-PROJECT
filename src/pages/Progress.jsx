import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, CalendarDays, CircleDollarSign, Moon, Smartphone, Target, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SectionTitle, StatCard } from "../components/UI";
import { dateLabel, parseDuration, useLifeLog } from "../data/LifeLogContext";

const WEEK_DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
function mondayOf(date) { const d = new Date(`${date}T00:00:00`); const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day; d.setDate(d.getDate() + diff); return d.toISOString().slice(0,10); }
function addDays(date, n) { const d = new Date(`${date}T00:00:00`); d.setDate(d.getDate()+n); return d.toISOString().slice(0,10); }
function minsToText(mins) { const h = Math.floor(mins/60), m = Math.round(mins%60); return h ? `${h}h ${m}m` : `${m}m`; }

export default function Progress() {
  const { activities, studySessions, expenses, screenTime, moodSleep, goals, defaultDate } = useLifeLog();
  const [mode, setMode] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const weekStart = mondayOf(selectedDate);
  const weekDates = WEEK_DAYS.map((_,i)=>addDays(weekStart,i));

  const dayData = useMemo(() => {
    const studies = studySessions.filter(x => x.dateISO === selectedDate);
    const dayExpenses = expenses.filter(x => x.dateISO === selectedDate);
    const dayApps = screenTime.filter(x => x.dateISO === selectedDate);
    const dayActivities = activities.filter(x => x.date === selectedDate);
    const sleep = moodSleep.find(x => x.dateISO === selectedDate);
    const studyMinutes = studies.reduce((s,x)=>s+parseDuration(x.duration),0);
    const activityMinutes = dayActivities.reduce((s,x)=>s+parseDuration(x.duration),0);
    const screenMinutes = dayApps.reduce((s,x)=>s+Number(x.duration_minutes||0),0);
    const spend = dayExpenses.reduce((s,x)=>s+Number(x.amount||0),0);
    const productivity = studies.length ? Math.round(studies.reduce((s,x)=>s+Number(x.rating||0),0)/studies.length*20) : 0;
    return { studies, dayExpenses, dayApps, dayActivities, sleep, studyMinutes, activityMinutes, screenMinutes, spend, productivity };
  }, [activities, studySessions, expenses, screenTime, moodSleep, selectedDate]);

  const weekly = useMemo(() => weekDates.map((date,i)=>({
    date, day: WEEK_DAYS[i],
    study: studySessions.filter(x=>x.dateISO===date).reduce((s,x)=>s+parseDuration(x.duration)/60,0),
    spend: expenses.filter(x=>x.dateISO===date).reduce((s,x)=>s+Number(x.amount||0),0),
    screen: screenTime.filter(x=>x.dateISO===date).reduce((s,x)=>s+Number(x.duration_minutes||0),0),
    mood: moodSleep.find(x=>x.dateISO===date)?.moodScore || null,
    sleep: moodSleep.find(x=>x.dateISO===date)?.sleepHours || null,
  })), [weekDates, studySessions, expenses, screenTime, moodSleep]);

  const weeklyTotals = useMemo(() => ({
    study: weekly.reduce((s,x)=>s+x.study,0), spend: weekly.reduce((s,x)=>s+x.spend,0), screen: weekly.reduce((s,x)=>s+x.screen,0),
    avgMood: weekly.filter(x=>x.mood).reduce((s,x)=>s+x.mood,0)/(weekly.filter(x=>x.mood).length||1),
    avgSleep: weekly.filter(x=>x.sleep).reduce((s,x)=>s+x.sleep,0)/(weekly.filter(x=>x.sleep).length||1),
  }), [weekly]);

  return <div>
    <PageHeader title="Daily & Weekly Progress" description="Track your progress for one day or compare your whole week." icon={TrendingUp}/>
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex rounded-xl bg-slate-100 p-1"><button onClick={()=>setMode("daily")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode==="daily"?"bg-white shadow-sm text-slate-900":"text-slate-500"}`}>Daily</button><button onClick={()=>setMode("weekly")} className={`rounded-lg px-4 py-2 text-sm font-semibold ${mode==="weekly"?"bg-white shadow-sm text-slate-900":"text-slate-500"}`}>Weekly</button></div>
      <div className="flex items-center gap-2"><CalendarDays size={17} className="text-slate-400"/><input className="input w-auto" type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}/></div>
    </div>

    {mode === "daily" ? <>
      <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Selected day</p><h2 className="mt-1 text-xl font-bold">{dateLabel(selectedDate)}</h2></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">Local demo data</span></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Study" value={minsToText(dayData.studyMinutes)} change={`${dayData.studies.length} sessions`} icon="BookOpen" tone="blue"/>
        <StatCard label="Activities" value={minsToText(dayData.activityMinutes)} change={`${dayData.dayActivities.length} logged`} icon="Activity" tone="violet"/>
        <StatCard label="Spending" value={`₹${dayData.spend.toFixed(0)}`} change={`${dayData.dayExpenses.length} entries`} icon="CircleDollarSign" tone="emerald"/>
        <StatCard label="Screen time" value={minsToText(dayData.screenMinutes)} change={`${dayData.dayApps.length} apps`} icon="Smartphone" tone="amber"/>
        <StatCard label="Sleep" value={dayData.sleep ? `${dayData.sleep.sleepHours}h` : "—"} change={dayData.sleep ? `${dayData.sleep.quality}/5 quality` : "Not logged"} icon="Moon" tone="indigo"/>
        <StatCard label="Productivity" value={dayData.productivity ? `${dayData.productivity}/100` : "—"} change="From study ratings" icon="TrendingUp" tone="rose"/>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5"><SectionTitle>Daily activity progress</SectionTitle><div className="space-y-5">
          {[['Study time', dayData.studyMinutes, 300, BookOpen],['Activities', dayData.activityMinutes, 480, Target],['Screen time', dayData.screenMinutes, 240, Smartphone]].map(([label,value,target,Icon])=>{const pct=Math.min(100,Math.round(value/target*100));return <div key={label}><div className="mb-2 flex justify-between text-sm"><span className="flex items-center gap-2 font-semibold"><Icon size={15}/>{label}</span><span className="text-slate-500">{label==='Activities'?minsToText(value):minsToText(value)} · {pct}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-900" style={{width:`${pct}%`}}/></div></div>})}
        </div></div>
        <div className="card p-5"><SectionTitle action={<span className="text-xs text-slate-400">{dayData.studies.length} sessions</span>}>Study sessions</SectionTitle><div className="space-y-2">{dayData.studies.length ? dayData.studies.map((x,i)=><div key={x.id||i} className="flex items-center justify-between rounded-xl bg-slate-50 p-3"><div><p className="text-sm font-bold">{x.subject}</p><p className="text-xs text-slate-400">{x.topic || 'Study session'} · {x.duration}</p></div><span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold">{x.rating}/5</span></div>) : <p className="py-8 text-center text-sm text-slate-400">No study sessions for this date yet.</p>}</div></div>
      </div>
    </> : <>
      <div className="mb-5"><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Week of</p><h2 className="mt-1 text-xl font-bold">{dateLabel(weekStart)} – {dateLabel(addDays(weekStart,6))}</h2></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Study" value={`${weeklyTotals.study.toFixed(1)}h`} change="Mon–Sun" icon="BookOpen" tone="blue"/>
        <StatCard label="Spending" value={`₹${weeklyTotals.spend.toFixed(0)}`} change="Mon–Sun" icon="CircleDollarSign" tone="emerald"/>
        <StatCard label="Screen time" value={minsToText(weeklyTotals.screen)} change="Mon–Sun" icon="Smartphone" tone="amber"/>
        <StatCard label="Avg sleep" value={`${weeklyTotals.avgSleep.toFixed(1)}h`} change="7-day avg" icon="Moon" tone="indigo"/>
        <StatCard label="Avg mood" value={`${weeklyTotals.avgMood.toFixed(1)}/10`} change="7-day avg" icon="TrendingUp" tone="rose"/>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5"><SectionTitle>Weekly study progression</SectionTitle><div className="h-72"><ResponsiveContainer><BarChart data={weekly}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip formatter={v=>[`${Number(v).toFixed(1)} h`,"Study"]}/><Bar dataKey="study" fill="#0f172a" radius={[7,7,0,0]}/></BarChart></ResponsiveContainer></div></div>
        <div className="card p-5"><SectionTitle>Weekly spending progression</SectionTitle><div className="h-72"><ResponsiveContainer><LineChart data={weekly}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="day" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip formatter={v=>[`₹${Number(v).toFixed(0)}`,"Spend"]}/><Line type="monotone" dataKey="spend" stroke="#0f172a" strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></div></div>
      </div>
      <div className="mt-6 card p-5"><SectionTitle>Weekly day-by-day breakdown</SectionTitle><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-3">Day</th><th>Study</th><th>Spend</th><th>Screen time</th><th>Sleep</th><th>Mood</th><th></th></tr></thead><tbody className="divide-y divide-slate-100">{weekly.map(x=><tr key={x.date} className="hover:bg-slate-50"><td className="px-4 py-4 font-semibold">{x.day} <span className="ml-1 text-xs text-slate-400">{x.date.slice(5)}</span></td><td>{x.study.toFixed(1)}h</td><td>₹{x.spend.toFixed(0)}</td><td>{minsToText(x.screen)}</td><td>{x.sleep ? `${x.sleep}h` : '—'}</td><td>{x.mood ? `${x.mood}/10` : '—'}</td><td><button onClick={()=>{setSelectedDate(x.date);setMode('daily')}} className="text-xs font-semibold text-slate-500 hover:text-slate-900">View day <ArrowUpRight size={13} className="inline"/></button></td></tr>)}</tbody></table></div></div>
    </>}
    <p className="mt-6 text-center text-xs text-slate-400">Data is stored locally in your browser for now. The Express + MySQL backend can replace this local store later.</p>
  </div>
}
