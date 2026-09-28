import { useMemo, useState } from "react";
import { Smartphone, Trash2, Youtube, MessageCircle } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Field,
  FormActions,
  Modal,
  PageHeader,
  SectionTitle,
  SelectField,
  StatCard,
} from "../components/UI";
import { getLocalDateISO, useLifeLog } from "../data/LifeLogContext";
export default function ScreenTime() {
  const { screenTime, defaultDate, add, remove } = useLifeLog();
  const blank = {
    application_name: "YouTube",
    category: "Entertainment",
    duration_minutes: "30",
    dateISO: defaultDate || getLocalDateISO(),
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const total = useMemo(
    () => screenTime.reduce((s, x) => s + Number(x.duration_minutes || 0), 0),
    [screenTime],
  );
  const chart = useMemo(() => {
    const m = {};
    screenTime.forEach(
      (x) =>
        (m[x.application_name] =
          (m[x.application_name] || 0) + Number(x.duration_minutes || 0)),
    );
    return Object.entries(m)
      .map(([app, minutes]) => ({ app, minutes }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 8);
  }, [screenTime]);
  async function submit(e) {
    e.preventDefault();
    if (!form.application_name) return;
    setSaving(true);
    const result = await add("screenTime", {
      ...form,
      duration_minutes: Number(form.duration_minutes || 0),
    });
    setSaving(false);
    if (!result?.ok) return;
    setOpen(false);
    setForm(blank);
  }
  return (
    <div>
      <PageHeader
        title="Screen Time"
        description="Find the apps consuming your attention."
        action={() => setOpen(true)}
        actionLabel="Log screen time"
        icon={Smartphone}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Logged time"
          value={`${Math.floor(total / 60)}h ${total % 60}m`}
          change={`${screenTime.length} entries`}
          icon="Smartphone"
          tone="amber"
        />
        <StatCard
          label="Top app"
          value={chart[0]?.app || "—"}
          change={chart[0] ? `${chart[0].minutes}m` : "No data"}
          icon="Youtube"
          tone="rose"
        />
        <StatCard
          label="Social apps"
          value={`${screenTime.filter((x) => x.category === "Social").reduce((s, x) => s + Number(x.duration_minutes || 0), 0)}m`}
          change="logged"
          icon="MessageCircle"
          tone="violet"
        />
      </div>
      <div className="mt-6 card p-5">
        <SectionTitle>App usage</SectionTitle>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart
              data={chart}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="app"
                width={90}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip formatter={(v) => [`${v} min`, `Usage`]} />
              <Bar dataKey="minutes" fill="#0f172a" radius={[0, 7, 7, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 card overflow-hidden">
        <div className="p-5">
          <SectionTitle>Logged entries</SectionTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">App</th>
                <th>Category</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {screenTime.map((x) => (
                <tr key={x.id}>
                  <td className="px-5 py-4 font-semibold">
                    {x.application_name}
                  </td>
                  <td>{x.category}</td>
                  <td className="text-slate-500">{x.dateISO}</td>
                  <td>{x.duration_minutes} min</td>
                  <td>
                    <button
                      onClick={() => remove("screenTime", x.id)}
                      className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Log screen time">
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Application"
            required
            value={form.application_name}
            onChange={(e) =>
              setForm({ ...form, application_name: e.target.value })
            }
            placeholder="e.g. YouTube"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Entertainment</option>
              <option>Social</option>
              <option>Productivity</option>
              <option>Education</option>
              <option>Other</option>
            </SelectField>
            <Field
              label="Date"
              type="date"
              value={form.dateISO}
              onChange={(e) => setForm({ ...form, dateISO: e.target.value })}
            />
          </div>
          <Field
            label="Duration (minutes)"
            type="number"
            min="0"
            required
            value={form.duration_minutes}
            onChange={(e) =>
              setForm({ ...form, duration_minutes: e.target.value })
            }
          />
          <FormActions onCancel={() => setOpen(false)} disabled={saving} />
        </form>
      </Modal>
    </div>
  );
}
