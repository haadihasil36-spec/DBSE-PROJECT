import { useMemo, useState } from "react";
import { BookOpen, Pencil, Trash2 } from "lucide-react";
import {
  Badge,
  Field,
  FormActions,
  Modal,
  PageHeader,
  SectionTitle,
  StatCard,
} from "../components/UI";
import { getLocalDateISO, parseDuration, useLifeLog } from "../data/LifeLogContext";
export default function Study() {
  const { studySessions, defaultDate, add, remove } = useLifeLog();
  const blank = {
    subject: "DBSE",
    topic: "",
    dateISO: defaultDate || getLocalDateISO(),
    duration: "1h",
    rating: 5,
  };
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const total = useMemo(
    () => studySessions.reduce((s, x) => s + parseDuration(x.duration), 0),
    [studySessions],
  );
  async function submit(e) {
    e.preventDefault();
    if (!form.subject) return;
    setSaving(true);
    const result = await add("studySessions", {
      ...form,
      duration: form.duration,
      date: `Sep ${form.dateISO.slice(-2)}`,
    });
    setSaving(false);
    if (!result?.ok) return;
    setOpen(false);
    setForm(blank);
  }
  return (
    <div>
      <PageHeader
        title="Study"
        description="Turn study sessions into measurable progress."
        action={() => setOpen(true)}
        actionLabel="Log study session"
        icon={BookOpen}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total study"
          value={`${(total / 60).toFixed(1)}h`}
          change="all logged"
          icon="BookOpen"
          tone="blue"
        />
        <StatCard
          label="Sessions"
          value={studySessions.length}
          change="logged"
          icon="Clock3"
          tone="violet"
        />
        <StatCard
          label="Avg rating"
          value={`${(studySessions.reduce((s, x) => s + Number(x.rating || 0), 0) / (studySessions.length || 1)).toFixed(1)}/5`}
          change="productivity"
          icon="Sparkles"
          tone="emerald"
        />
      </div>
      <div className="mt-6 card overflow-hidden">
        <div className="p-5">
          <SectionTitle>Recent study sessions</SectionTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Subject</th>
                <th>Topic</th>
                <th>Date</th>
                <th>Duration</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {studySessions.map((x) => (
                <tr key={x.id}>
                  <td className="px-5 py-4 font-semibold">{x.subject}</td>
                  <td className="text-slate-500">{x.topic || "—"}</td>
                  <td className="text-slate-500">{x.dateISO}</td>
                  <td>{x.duration}</td>
                  <td>
                    <Badge tone="blue">{x.rating}/5</Badge>
                  </td>
                  <td>
                    <button
                      onClick={() => remove("studySessions", x.id)}
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
        title="Log study session"
      >
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Subject"
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <Field
            label="Topic"
            value={form.topic}
            onChange={(e) => setForm({ ...form, topic: e.target.value })}
            placeholder="e.g. Normalization"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Date"
              type="date"
              value={form.dateISO}
              onChange={(e) => setForm({ ...form, dateISO: e.target.value })}
            />
            <Field
              label="Duration"
              required
              value={form.duration}
              onChange={(e) => setForm({ ...form, duration: e.target.value })}
              placeholder="e.g. 1h 30m"
            />
          </div>
          <Field
            label="Productivity rating (1–5)"
            type="number"
            min="1"
            max="5"
            value={form.rating}
            onChange={(e) => setForm({ ...form, rating: e.target.value })}
          />
          <FormActions onCancel={() => setOpen(false)} disabled={saving} />
        </form>
      </Modal>
    </div>
  );
}
