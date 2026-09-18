import { useEffect } from "react";
import * as Icons from "lucide-react";

export function PageHeader({ title, description, action, actionLabel = "Add new", icon: Icon = null }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={20} className="text-slate-500"/>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
      </div>
      {description && <p className="mt-1.5 text-sm text-slate-500">{description}</p>}
    </div>
    {action && <button className="btn-primary self-start sm:self-auto" onClick={action}><Icons.Plus size={17}/>{actionLabel}</button>}
  </div>
}

export function SectionTitle({children, action}) {
  return <div className="mb-4 flex items-center justify-between"><h2 className="text-base font-bold text-slate-900">{children}</h2>{action}</div>
}

export function StatCard({ label, value, change, icon, tone = "blue" }) {
  const Icon = Icons[icon] || Icons.Activity;
  const tones = {
    blue: "bg-blue-50 text-blue-600", indigo: "bg-indigo-50 text-indigo-600", emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600", rose: "bg-rose-50 text-rose-600", violet: "bg-violet-50 text-violet-600"
  };
  return <div className="card p-5">
    <div className="flex items-start justify-between"><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>{<Icon size={19}/>}</div><span className="rounded-full bg-slate-50 px-2 py-1 text-[11px] font-bold text-emerald-600">{change}</span></div>
    <p className="mt-4 text-xs font-medium text-slate-400">{label}</p><p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
  </div>
}

export function EmptyState({ icon: Icon = Icons.Inbox, title, text }) {
  return <div className="card grid place-items-center px-6 py-14 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon size={22}/></div><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p></div>
}

export function Badge({ children, tone = "slate" }) {
  const map = { slate:"bg-slate-100 text-slate-600", blue:"bg-blue-50 text-blue-700", green:"bg-emerald-50 text-emerald-700", amber:"bg-amber-50 text-amber-700", rose:"bg-rose-50 text-rose-700", violet:"bg-violet-50 text-violet-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${map[tone] || map.slate}`}>{children}</span>
}

export function Modal({ open, title, onClose, children }) {
  useEffect(() => {
    const onKey = e => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[100] grid place-items-center bg-slate-900/40 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><h3 className="font-bold">{title}</h3><button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><Icons.X size={18}/></button></div>
      <div className="p-5">{children}</div>
    </div>
  </div>
}

export function Field({ label, ...props }) {
  return <label className="block"><span className="label">{label}</span><input className="input" {...props}/></label>
}

export function SelectField({ label, children, ...props }) {
  return <label className="block"><span className="label">{label}</span><select className="input" {...props}>{children}</select></label>
}

export function FormActions({ onCancel, submit = "Save" }) {
  return <div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onCancel} className="btn-secondary">Cancel</button><button className="btn-primary" type="submit">{submit}</button></div>
}