import { useMemo, useState } from "react";
import {
  CircleDollarSign,
  Pencil,
  Receipt,
  Trash2,
  TrendingDown,
} from "lucide-react";
import {
  Badge,
  Field,
  FormActions,
  Modal,
  PageHeader,
  SectionTitle,
  SelectField,
  StatCard,
} from "../components/UI";
import { getLocalDateISO, useLifeLog } from "../data/LifeLogContext";
export default function Expenses() {
  const { expenses, defaultDate, add, remove, update } = useLifeLog();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const blank = {
    description: "",
    category: "Food",
    amount: "",
    method: "UPI",
    dateISO: defaultDate || getLocalDateISO(),
  };
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const total = useMemo(
    () => expenses.reduce((s, x) => s + Number(x.amount || 0), 0),
    [expenses],
  );
  async function submit(e) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    const item = {
      ...form,
      amount: Number(form.amount),
    };
    setSaving(true);
    const result = editing
      ? await update("expenses", editing, item)
      : await add("expenses", item);
    setSaving(false);
    if (!result?.ok) return;
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }
  return (
    <div>
      <PageHeader
        title="Expenses"
        description="Understand where your money goes."
        action={() => {
          setEditing(null);
          setForm(blank);
          setOpen(true);
        }}
        actionLabel="Add expense"
        icon={CircleDollarSign}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Total logged"
          value={`₹${total.toFixed(0)}`}
          change={`${expenses.length} entries`}
          icon="Wallet"
          tone="emerald"
        />
        <StatCard
          label="Average"
          value={`₹${expenses.length ? (total / expenses.length).toFixed(0) : 0}`}
          change="per entry"
          icon="Receipt"
          tone="blue"
        />
        <StatCard
          label="Entries"
          value={expenses.length}
          change="from LifeLog API"
          icon="TrendingDown"
          tone="violet"
        />
      </div>
      <div className="mt-6 card overflow-hidden">
        <div className="p-5">
          <SectionTitle>Recent expenses</SectionTitle>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3">Description</th>
                <th>Category</th>
                <th>Date</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((x) => (
                <tr key={x.id}>
                  <td className="px-5 py-4 font-semibold">{x.description}</td>
                  <td>
                    <Badge tone="slate">{x.category}</Badge>
                  </td>
                  <td className="text-slate-500">{x.dateISO}</td>
                  <td className="text-slate-500">{x.method}</td>
                  <td className="font-bold">₹{Number(x.amount).toFixed(2)}</td>
                  <td>
                    <button
                      onClick={() => {
                        setEditing(x.id);
                        setForm({
                          description: x.description,
                          category: x.category,
                          amount: x.amount,
                          method: x.method,
                          dateISO: x.dateISO,
                        });
                        setOpen(true);
                      }}
                      className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => remove("expenses", x.id)}
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
        title={editing ? "Edit expense" : "Add expense"}
      >
        <form onSubmit={submit} className="space-y-4">
          <Field
            label="Description"
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="e.g. Lunch"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {[
                "Food",
                "Travel",
                "Education",
                "Entertainment",
                "Personal",
                "Other",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </SelectField>
            <Field
              label="Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Payment method"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
            >
              <option>UPI</option>
              <option>Cash</option>
              <option>Card</option>
            </SelectField>
            <Field
              label="Date"
              type="date"
              value={form.dateISO}
              onChange={(e) => setForm({ ...form, dateISO: e.target.value })}
            />
          </div>
          <FormActions
            onCancel={() => setOpen(false)}
            submit={editing ? "Update" : "Save"}
            disabled={saving}
          />
        </form>
      </Modal>
    </div>
  );
}
