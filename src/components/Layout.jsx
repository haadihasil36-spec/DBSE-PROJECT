import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity, BarChart3, BookOpen, Car, ChevronLeft, ChevronRight, CircleDollarSign,
  Clock3, LayoutDashboard, LogOut, Menu, Moon, Settings, Smartphone, Sparkles,
  Target, Utensils, UserRound, X, HeartPulse, Gauge
} from "lucide-react";
import { user } from "../data/mockData";

const nav = [
  ["Dashboard", "/", LayoutDashboard],
  ["Daily Timeline", "/timeline", Clock3],
  ["Activities", "/activities", Activity],
  ["Study", "/study", BookOpen],
  ["Expenses", "/expenses", CircleDollarSign],
  ["Food", "/food", Utensils],
  ["Transport", "/transport", Car],
  ["Screen Time", "/screen-time", Smartphone],
  ["Mood & Sleep", "/mood-sleep", HeartPulse],
  ["Goals", "/goals", Target],
  ["Analytics", "/analytics", BarChart3],
  ["Progress", "/progress", Gauge],
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const sidebar = (
    <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-200 ${collapsed ? "w-[76px]" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex h-20 items-center justify-between border-b border-slate-100 px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Activity size={21} />
          </span>
          {!collapsed && <span><b className="block text-base">LifeLog</b><small className="text-xs text-slate-400">Personal intelligence</small></span>}
        </button>
        <button className="hidden rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:block" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className={`px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400 ${collapsed ? "text-center" : ""}`}>{collapsed ? "•" : "Workspace"}</p>
        {nav.map(([label, path, Icon]) => (
          <NavLink key={path} to={path} onClick={() => setMobileOpen(false)}
            className={({isActive}) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}>
            <Icon size={18} className="shrink-0"/>
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <NavLink to="/settings" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100">
          <Settings size={18}/>{!collapsed && "Settings"}
        </NavLink>
        <div className={`mt-2 flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 ${collapsed ? "justify-center" : ""}`}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-200 text-sm font-bold">RS</div>
          {!collapsed && <div className="min-w-0"><p className="truncate text-xs font-bold">{user.name}</p><p className="truncate text-[11px] text-slate-400">{user.email}</p></div>}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebar}
      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"/>}
      <main className={`min-h-screen transition-all duration-200 ${collapsed ? "lg:pl-[76px]" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-7">
          <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20}/></button>
          <div className="hidden lg:block"><p className="text-xs text-slate-400">Monday, September 7, 2026</p><p className="text-sm font-semibold">Good morning, Rahul 👋</p></div>
          <div className="ml-auto flex items-center gap-2">
            <button title="Open insights" onClick={() => navigate("/analytics")} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><Sparkles size={18}/></button>
            <button onClick={() => navigate("/settings")} className="grid h-9 w-9 place-items-center rounded-full bg-slate-900 text-xs font-bold text-white">RS</button>
          </div>
        </header>
        <div className="p-4 md:p-7">{children}</div>
      </main>
    </div>
  );
}