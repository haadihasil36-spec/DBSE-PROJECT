import { useState } from "react";
import { CheckCircle2, Target, Trash2, TrendingUp } from "lucide-react";
import {
  Badge,
  Field,
  FormActions,
  Modal,
  PageHeader,
  SectionTitle,
  StatCard,
  SelectField,
} from "../components/UI";
import { getLocalDateISO, useLifeLog } from "../data/LifeLogContext";

function offsetDate(date, offset) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offset)).toISOString().slice(0, 10);
}

export default function Goals() {
  const { goals, defaultDate, add, remove, addGoalProgress } = useLifeLog();
  const today = defaultDate || getLocalDateISO();
  const blank = {
    name: "",
    type: "Study",
    current: 0,
    target: 30,
    unit: "hours",
    deadline: offsetDate(today, 30),
    startDate: today,
    status: "Active",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [progressGoal, setProgressGoal] = useState(null);
  const [progressDate, setProgressDate] = useState(today);
  const [progressValue, setProgressValue] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    const result = await add("goals", {
      ...form,
      current: Number(form.current),
      target: Number(form.target),
    });
    setSaving(false);
    if (!result?.ok) return;
    setOpen(false);
    setForm(blank);
  }
  async function submitProgress(e) {
    e.preventDefault();
    if (!progressGoal || progressValue === "") return;
    setSaving(true);
    const result = await addGoalProgress(progressGoal.id, progressDate, progressValue);
    setSaving(false);
    if (!result?.ok) return;
    setProgressGoal(null);
  }
  return (
    <div>
      <PageHeader
        title="Goals"
        description="Turn intentions into measurable progress."
        action={() => setOpen(true)}
        actionLabel="Create goal"
        icon={Target}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active goals"
          value={goals.length}
          change="from LifeLog API"
          icon="Target"
          tone="violet"
        />
        <StatCard
          label="On track"
          value={
            goals.filter(
              (g) =>
                g.status === "On track" ||
                g.status === "Active" ||
                g.status === "Safe",
            ).length
          }
          change="current"
          icon="TrendingUp"
          tone="emerald"
        />
        <StatCard
          label="Completed"
          value={goals.filter((g) => g.status === "Completed").length}
          change="current"
          icon="CheckCircle2"
          tone="blue"
        />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {goals.map((g) => {
          const pct = Math.min(100, Number(g.progressPercent ?? (Number(g.current) / (Number(g.target) || 1)) * 100));
          return (
            <div className="card p-5" key={g.id}>
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-400">
                    {g.type}
                  </p>
                  <h3 className="mt-1 font-bold">{g.name}</h3>
                </div>
                <Badge tone="green">{g.status}</Badge>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <p className="text-2xl font-bold">
                  {g.unit === "₹" ? "₹" : ""}
                  {g.current}
                  {g.unit !== "₹" && ` ${g.unit}`}
                </p>
                <p className="text-xs text-slate-400">
                  of {g.unit === "₹" ? "₹" : ""}
                  {g.target} {g.unit !== "₹" && g.unit}
                </p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-400">
                {Math.round(pct)}% complete · deadline {g.deadline}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    setProgressGoal(g);
                    setProgressDate(today);
                    setProgressValue(String(Number(g.current || 0) + 1));
                  }}
                  className="btn-secondary text-xs"
                >
                  Update progress
                </button>
                <button
                  onClick={() => remove("goals", g.id)}
                  className="btn-secondary text-xs text-red-600"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Create goal">
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Goal name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Study 30 hours"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option>Study</option>
              <option>Exercise</option>
              <option>Budget</option>
              <option>Personal</option>
            </SelectField>
            <Field
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              placeholder="hours / days / ₹"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Current"
              type="number"
              min="0"
              step="0.01"
              value={form.current}
              onChange={(e) => setForm({ ...form, current: e.target.value })}
            />
            <Field
              label="Target"
              type="number"
              min="1"
              step="0.01"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            />
          </div>
          <Field
            label="Deadline"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
          <FormActions onCancel={() => setOpen(false)} disabled={saving} />
        </form>
      </Modal>
      <Modal open={!!progressGoal} onClose={() => setProgressGoal(null)} title={`Update ${progressGoal?.name || "goal"}`}>
        <form onSubmit={submitProgress} className="space-y-4">
          <Field label="Progress date" type="date" value={progressDate} onChange={(e) => setProgressDate(e.target.value)}/>
          <Field label={`Actual value${progressGoal?.unit ? ` (${progressGoal.unit})` : ""}`} type="number" min="0" step="0.01" required value={progressValue} onChange={(e) => setProgressValue(e.target.value)}/>
          <FormActions onCancel={() => setProgressGoal(null)} submit="Save progress" disabled={saving}/>
        </form>
      </Modal>
    </div>
  );
}
