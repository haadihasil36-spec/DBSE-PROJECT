import { useMemo, useState } from "react";
import { Heart, Moon, Smile, Sparkles, Trash2 } from "lucide-react";
import {
  Line,
  LineChart,
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
export default function MoodSleep() {
  const { moodSleep, defaultDate, add, remove } = useLifeLog();
  const blank = {
    dateISO: defaultDate || getLocalDateISO(),
    mood: "Great",
    moodScore: 8.0,
    sleepHours: 7.5,
    quality: 4,
    sleepStart: "23:00",
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const avgMood = useMemo(
    () =>
      moodSleep.reduce((s, x) => s + Number(x.moodScore || 0), 0) /
      (moodSleep.length || 1),
    [moodSleep],
  );
  const avgSleep = useMemo(
    () =>
      moodSleep.reduce((s, x) => s + Number(x.sleepHours || 0), 0) /
      (moodSleep.length || 1),
    [moodSleep],
  );
  return (
    <div>
      <PageHeader
        title="Mood & Sleep"
        description="Understand the relationship between recovery and how you feel."
        action={() => setOpen(true)}
        actionLabel="Log today"
        icon={Heart}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Avg sleep"
          value={`${avgSleep.toFixed(1)}h`}
          change="logged data"
          icon="Moon"
          tone="indigo"
        />
        <StatCard
          label="Avg mood"
          value={`${avgMood.toFixed(1)} / 10`}
          change="logged data"
          icon="Smile"
          tone="rose"
        />
        <StatCard
          label="Sleep quality"
          value={`${(moodSleep.reduce((s, x) => s + Number(x.quality || 0), 0) / (moodSleep.length || 1)).toFixed(1)} / 5`}
          change="logged data"
          icon="Sparkles"
          tone="emerald"
        />
      </div>
      <div className="mt-6 card p-5">
        <SectionTitle>Sleep vs mood</SectionTitle>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart
              data={moodSleep.map((x) => ({
                day: x.dateISO.slice(5),
                sleep: x.sleepHours,
                mood: x.moodScore,
              }))}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sleep"
                stroke="#0f172a"
                strokeWidth={3}
                name="Sleep (hours)"
              />
              <Line
                type="monotone"
                dataKey="mood"
                stroke="#64748b"
                strokeWidth={3}
                name="Mood"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-6 card overflow-hidden">
        <div className="p-5">
          <SectionTitle>Logged recovery</SectionTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th>Mood</th>
                <th>Score</th>
                <th>Sleep</th>
                <th>Quality</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {moodSleep.map((x) => (
                <tr key={x.id}>
                  <td className="px-5 py-4 font-semibold">{x.dateISO}</td>
                  <td>{x.mood}</td>
                  <td>{x.moodScore}/10</td>
                  <td>{x.sleepHours}h</td>
                  <td>{x.quality}/5</td>
                  <td>
                    <button
                      onClick={() => remove("moodSleep", x.id)}
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
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Log mood & sleep"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            const result = await add("moodSleep", {
              ...form,
              moodScore: Number(form.moodScore),
              sleepHours: Number(form.sleepHours),
              quality: Number(form.quality),
            });
            setSaving(false);
            if (!result?.ok) return;
            setOpen(false);
            setForm(blank);
          }}
          className="space-y-4"
        >
          <Field
            label="Date"
            type="date"
            value={form.dateISO}
            onChange={(e) => setForm({ ...form, dateISO: e.target.value })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Mood"
              value={form.mood}
              onChange={(e) => setForm({ ...form, mood: e.target.value })}
            >
              <option>Excellent</option>
              <option>Great</option>
              <option>Good</option>
              <option>Okay</option>
              <option>Low</option>
            </SelectField>
            <Field
              label="Mood score (1–10)"
              type="number"
              min="1"
              max="10"
              step="1"
              value={form.moodScore}
              onChange={(e) => setForm({ ...form, moodScore: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field
              label="Sleep starts"
              type="time"
              value={form.sleepStart}
              onChange={(e) => setForm({ ...form, sleepStart: e.target.value })}
            />
            <Field
              label="Sleep hours"
              type="number"
              min="0.5"
              step="0.1"
              value={form.sleepHours}
              onChange={(e) => setForm({ ...form, sleepHours: e.target.value })}
            />
            <Field
              label="Sleep quality (1–5)"
              type="number"
              min="1"
              max="5"
              value={form.quality}
              onChange={(e) => setForm({ ...form, quality: e.target.value })}
            />
          </div>
          <FormActions onCancel={() => setOpen(false)} disabled={saving} />
        </form>
      </Modal>
    </div>
  );
}
