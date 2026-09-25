import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Activity, BarChart3, BookOpen, Car, ChevronLeft, ChevronRight, CircleDollarSign,
  Clock3, LayoutDashboard, LogOut, Menu, Settings, Smartphone, Sparkles,
  Target, Utensils, X, HeartPulse, Gauge, Plus, UserRound
} from "lucide-react";
import { useAuth } from "../data/AuthContext";

const nav = [
  ["Dashboard", "/", LayoutDashboard], ["Daily Timeline", "/timeline", Clock3],
  ["Activities", "/activities", Activity], ["Study", "/study", BookOpen],
  ["Expenses", "/expenses", CircleDollarSign], ["Food", "/food", Utensils],
  ["Transport", "/transport", Car], ["Screen Time", "/screen-time", Smartphone],
  ["Mood & Sleep", "/mood-sleep", HeartPulse], ["Goals", "/goals", Target],
  ["Analytics", "/analytics", BarChart3], ["Progress", "/progress", Gauge],
];

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };
  const firstName = user?.name?.split(" ")[0] || "there";

  const sidebar = (
    <aside className={`lifelog-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r transition-all duration-200 ${collapsed ? "w-[78px]" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex h-20 items-center justify-between border-b border-white/10 px-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-3 text-left">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-400 to-violet-600 text-white shadow-lg shadow-indigo-950/30"><Activity size={21}/></span>
          {!collapsed && <span><b className="block text-base text-white">LifeLog</b><small className="brand-sub text-xs">Personal intelligence</small></span>}
        </button>
        <button aria-label="Collapse sidebar" className="hidden rounded-lg p-1.5 text-slate-500 hover:bg-white/10 hover:text-white lg:block" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}</button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <p className={`nav-label px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[.16em] ${collapsed ? "text-center" : ""}`}>{collapsed ? "•" : "Workspace"}</p>
        {nav.map(([label, path, Icon]) => <NavLink key={path} to={path} onClick={() => setMobileOpen(false)} className={({isActive}) => `nav-item group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? "active" : ""}`}><Icon size={18} className="shrink-0"/>{!collapsed && <span>{label}</span>}</NavLink>)}
      </nav>
      <div className="border-t border-white/10 p-3">
        <NavLink to="/settings" onClick={() => setMobileOpen(false)} className="nav-item flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"><Settings size={18}/>{!collapsed && "Settings"}</NavLink>
        <div className={`sidebar-profile mt-2 rounded-xl p-2.5 ${collapsed ? "flex justify-center" : ""}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-600 text-sm font-bold text-white">{user?.initials || "LL"}</div>
            {!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-white">{user?.name || "LifeLog user"}</p><p className="truncate text-[11px] text-slate-500">{user?.email}</p></div>}
          </div>
          {!collapsed && <button onClick={handleLogout} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white"><LogOut size={14}/> Sign out</button>}
        </div>
      </div>
    </aside>
  );

  return <div className="lifelog-shell min-h-screen">
    {sidebar}
    {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"/>}
    <main className={`min-h-screen transition-all duration-200 ${collapsed ? "lg:pl-[78px]" : "lg:pl-64"}`}>
      <header className="lifelog-topbar sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-7">
        <button className="rounded-xl p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20}/></button>
        <div className="hidden lg:block"><p className="text-[10px] font-bold uppercase tracking-[.15em] text-indigo-500">LifeLog workspace</p><p className="text-sm font-semibold text-slate-800">Good to see you, {firstName} <span className="text-base">👋</span></p></div>
        <div className="ml-auto flex items-center gap-2">
          <button title="Quick add activity" onClick={() => navigate("/activities")} className="hidden items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 sm:flex"><Plus size={14}/> Quick add</button>
          <button title="Open insights" onClick={() => navigate("/analytics")} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"><Sparkles size={18}/></button>
          <button title="Open profile settings" onClick={() => navigate("/settings")} className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-sm">{user?.initials || "LL"}</button>
        </div>
      </header>
      <div className="p-4 md:p-7">{children}</div>
    </main>
  </div>;
}
