import { useEffect, useState } from "react";
import { ChartNoAxesCombined, Sparkles } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, SectionTitle, StatCard } from "../components/UI";
import RequestStatus from "../components/RequestStatus";
import { api } from "../services/api";
import { getLocalDateISO } from "../data/LifeLogContext";
import { useLifeLog } from "../data/LifeLogContext";

const palette = ["#0f766e", "#6366f1", "#e8793f", "#0ea5e9", "#84a34a", "#db5b76"];

function offsetDate(date, offset) {
	const [year, month, day] = date.split("-").map(Number);
	return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}

function ChartPanel({ title, rows, children }) {
	return <div className="card p-5"><SectionTitle>{title}</SectionTitle><div className="h-72">{rows?.length ? <ResponsiveContainer>{children}</ResponsiveContainer> : <p className="grid h-full place-items-center text-sm text-slate-400">No data in this date range.</p>}</div></div>;
}

function InsightCard({ item }) {
	const text = item.value === null
		? "More records are needed to calculate this insight."
		: item.percentage !== undefined
			? `${item.value} · ${item.percentage}%${item.metric === null ? "" : ` · ${item.metric} ${item.unit || ""}`}`
			: `${item.value}${item.metric === null || item.metric === undefined ? "" : ` · ${item.metric} ${item.unit || ""}`}`;
	return <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/70 to-white p-3.5"><p className="text-sm font-bold text-slate-800">{item.label}</p><p className="mt-1 text-xs leading-5 text-slate-500">{text}</p></div>;
}

export default function Analytics() {
	const { clearError } = useLifeLog();
	const today = getLocalDateISO();
	const [from, setFrom] = useState(() => offsetDate(today, -29));
	const [to, setTo] = useState(today);
	const [analytics, setAnalytics] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;
		setLoading(true);
		api.getAnalytics({ from, to }).then((result) => {
			if (active) {
				setAnalytics(result);
				setError("");
			}
		}).catch((requestError) => {
			if (active) setError(requestError.message);
		}).finally(() => {
			if (active) setLoading(false);
		});
		return () => { active = false; };
	}, [from, to]);

	const charts = analytics?.charts || {};
	const summary = analytics?.summary || {};

	return <div>
		<PageHeader title="Analytics" description="Explore how your time, energy and spending move together." icon={ChartNoAxesCombined}/>
		<RequestStatus loading={loading} error={error} onDismiss={() => { setError(""); clearError(); }}/>
		<div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
			<label className="grid gap-1 text-xs font-semibold text-slate-500">From<input className="input w-auto" type="date" value={from} max={to} onChange={(event) => setFrom(event.target.value)}/></label>
			<label className="grid gap-1 text-xs font-semibold text-slate-500">To<input className="input w-auto" type="date" value={to} min={from} max={today} onChange={(event) => setTo(event.target.value)}/></label>
			<span className="ml-auto text-xs text-slate-400">Data from {analytics?.range?.from || from} to {analytics?.range?.to || to}</span>
		</div>
		<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
			<StatCard label="Spending" value={`₹${Number(summary.totalSpending || 0).toFixed(2)}`} change="selected range" icon="Wallet" tone="emerald"/>
			<StatCard label="Study" value={`${Number(summary.studyHours || 0).toFixed(1)}h`} change="focused" icon="BookOpen" tone="blue"/>
			<StatCard label="Screen time" value={`${summary.screenTimeMinutes || 0}m`} change="logged" icon="Smartphone" tone="amber"/>
			<StatCard label="Productivity" value={summary.averageProductivity == null ? "—" : `${summary.averageProductivity}/5`} change="average rating" icon="BrainCircuit" tone="violet"/>
		</div>

		<div className="mt-6 grid gap-6 lg:grid-cols-2">
			<ChartPanel title="Spending by category" rows={charts.spendingByCategory}><PieChart><Pie data={charts.spendingByCategory} dataKey="amount" nameKey="category" innerRadius={56} outerRadius={92} paddingAngle={3}>{charts.spendingByCategory?.map((row, index) => <Cell key={row.category} fill={palette[index % palette.length]}/>)}</Pie><Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Spending"]}/></PieChart></ChartPanel>
			<ChartPanel title="Spending by day" rows={charts.spendingByDay}><LineChart data={charts.spendingByDay}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Spending"]}/><Line type="monotone" dataKey="amount" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }}/></LineChart></ChartPanel>
			<ChartPanel title="Study hours by subject" rows={charts.studyBySubject}><BarChart data={charts.studyBySubject}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="subject" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[6,6,0,0]}/></BarChart></ChartPanel>
			<ChartPanel title="Study hours by day" rows={charts.studyByDay}><LineChart data={charts.studyByDay}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Line type="monotone" dataKey="hours" name="Hours" stroke="#0f766e" strokeWidth={3} dot={{ r: 3 }}/></LineChart></ChartPanel>
			<ChartPanel title="Average productivity by subject" rows={charts.productivityBySubject}><BarChart data={charts.productivityBySubject}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="subject" tickLine={false} axisLine={false}/><YAxis domain={[0,5]} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="averageRating" name="Average rating" fill="#e8793f" radius={[6,6,0,0]}/></BarChart></ChartPanel>
			<ChartPanel title="Screen time by application" rows={charts.screenTimeByApp}><BarChart data={charts.screenTimeByApp} layout="vertical" margin={{ left: 12 }}><CartesianGrid horizontal={false} strokeDasharray="3 3"/><XAxis type="number" tickLine={false} axisLine={false}/><YAxis type="category" dataKey="applicationName" width={110} tickLine={false} axisLine={false}/><Tooltip formatter={(value) => [`${value} min`, "Screen time"]}/><Bar dataKey="minutes" fill="#e8793f" radius={[0,6,6,0]}/></BarChart></ChartPanel>
			<ChartPanel title="Screen time by category" rows={charts.screenTimeByCategory}><PieChart><Pie data={charts.screenTimeByCategory} dataKey="minutes" nameKey="category" innerRadius={56} outerRadius={92} paddingAngle={3}>{charts.screenTimeByCategory?.map((row, index) => <Cell key={row.category} fill={palette[index % palette.length]}/>)}</Pie><Tooltip formatter={(value) => [`${value} min`, "Screen time"]}/></PieChart></ChartPanel>
			<ChartPanel title="Mood trend" rows={charts.moodTrend}><LineChart data={charts.moodTrend}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" tickLine={false} axisLine={false}/><YAxis domain={[0,10]} tickLine={false} axisLine={false}/><Tooltip/><Line type="monotone" dataKey="averageScore" name="Mood score" stroke="#db5b76" strokeWidth={3} dot={{ r: 3 }}/></LineChart></ChartPanel>
			<ChartPanel title="Sleep duration and quality" rows={charts.sleepTrend}><LineChart data={charts.sleepTrend}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="date" tickLine={false} axisLine={false}/><YAxis yAxisId="hours" tickLine={false} axisLine={false}/><YAxis yAxisId="quality" orientation="right" domain={[0,5]} tickLine={false} axisLine={false}/><Tooltip/><Line yAxisId="hours" type="monotone" dataKey="durationHours" name="Sleep hours" stroke="#6366f1" strokeWidth={3}/><Line yAxisId="quality" type="monotone" dataKey="averageQuality" name="Quality / 5" stroke="#0f766e" strokeWidth={2}/></LineChart></ChartPanel>
			<ChartPanel title="Activity time by category" rows={charts.activityByCategory}><BarChart data={charts.activityByCategory}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="category" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="hours" name="Hours" fill="#0f766e" radius={[6,6,0,0]}/></BarChart></ChartPanel>
			<ChartPanel title="Activity time by location" rows={charts.activityByLocation}><BarChart data={charts.activityByLocation}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="location" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="hours" name="Hours" fill="#6366f1" radius={[6,6,0,0]}/></BarChart></ChartPanel>
			<ChartPanel title="Transport time and distance" rows={charts.transportByMode}><BarChart data={charts.transportByMode}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="mode" tickLine={false} axisLine={false}/><YAxis yAxisId="minutes" tickLine={false} axisLine={false}/><YAxis yAxisId="distance" orientation="right" tickLine={false} axisLine={false}/><Tooltip/><Bar yAxisId="minutes" dataKey="minutes" name="Minutes" fill="#e8793f"/><Bar yAxisId="distance" dataKey="distanceKm" name="Distance km" fill="#0ea5e9"/></BarChart></ChartPanel>
			<ChartPanel title="Food spending by meal" rows={charts.foodSpendingByMeal}><BarChart data={charts.foodSpendingByMeal}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="mealType" tickLine={false} axisLine={false}/><YAxis tickLine={false} axisLine={false}/><Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, "Spending"]}/><Bar dataKey="amount" fill="#84a34a" radius={[6,6,0,0]}/></BarChart></ChartPanel>
			<ChartPanel title="Productivity by day of week" rows={charts.productivityByDayOfWeek}><BarChart data={charts.productivityByDayOfWeek}><CartesianGrid vertical={false} strokeDasharray="3 3"/><XAxis dataKey="dayOfWeek" tickLine={false} axisLine={false}/><YAxis domain={[0,5]} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="averageRating" name="Average rating" fill="#db5b76" radius={[6,6,0,0]}/></BarChart></ChartPanel>
		</div>

		<div className="mt-6 card border-slate-900 bg-slate-900 p-6 text-white"><div className="flex items-start gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10"><Sparkles/></div><div><h3 className="font-bold">LifeLog Intelligence</h3><div className="mt-3 grid gap-3 sm:grid-cols-2">{analytics?.insights?.map((item) => <InsightCard key={item.key} item={item}/>)}</div>{!analytics?.insights?.length&&<p className="mt-2 text-sm text-slate-300">Insights will appear as you add data.</p>}</div></div></div>
	</div>;
}