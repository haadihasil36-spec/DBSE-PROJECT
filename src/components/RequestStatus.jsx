import { AlertCircle, LoaderCircle, X } from "lucide-react";

export default function RequestStatus({ loading, error, onDismiss }) {
  if (!loading && !error) return null;
  return (
    <div className={`mb-4 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-white text-slate-500"}`}>
      {error ? <AlertCircle size={16} className="shrink-0"/> : <LoaderCircle size={16} className="shrink-0 animate-spin"/>}
      <span className="flex-1">{error || "Loading your LifeLog data…"}</span>
      {error && onDismiss && <button type="button" onClick={onDismiss} aria-label="Dismiss error" className="rounded p-1 hover:bg-rose-100"><X size={15}/></button>}
    </div>
  );
}
