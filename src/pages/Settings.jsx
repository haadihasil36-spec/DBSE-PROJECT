import { useState } from "react";
import { Bell, Lock, Settings as SettingsIcon, UserRound } from "lucide-react";
import { Field, Modal, PageHeader, SectionTitle } from "../components/UI";
import { useAuth } from "../data/AuthContext";
export default function Settings() {
  const { user } = useAuth();
  const [open, setOpen] = useState(null);
  const [saved, setSaved] = useState(false);
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your LifeLog profile and preferences."
        icon={SettingsIcon}
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <SectionTitle>Profile</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={user.name} readOnly />
            <Field label="Email" value={user.email} readOnly />
          </div>
          <button
            onClick={() => {
              setSaved(true);
              setTimeout(() => setSaved(false), 1800);
            }}
            className="btn-primary mt-5"
          >
            {saved ? "Profile synced" : "Profile from account"}
          </button>
        </div>
        <div className="card p-5">
          <SectionTitle>Preferences</SectionTitle>
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-3">
              <span>
                <b className="block text-sm">Daily reminders</b>
                <small className="text-xs text-slate-400">
                  Remind me to complete my log
                </small>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <b className="block text-sm">Weekly insights</b>
                <small className="text-xs text-slate-400">
                  Show a weekly summary
                </small>
              </span>
              <input type="checkbox" defaultChecked />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <b className="block text-sm">Compact timeline</b>
                <small className="text-xs text-slate-400">
                  Show more activities at once
                </small>
              </span>
              <input type="checkbox" />
            </label>
          </div>
        </div>
      </div>
      <div className="mt-6 card p-5">
        <SectionTitle>Account actions</SectionTitle>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={() => setOpen("password")} className="btn-secondary">
            <Lock size={16} />
            Change password
          </button>
          <button
            onClick={() => setOpen("notifications")}
            className="btn-secondary"
          >
            <Bell size={16} />
            Notification settings
          </button>
          <button onClick={() => setOpen("profile")} className="btn-secondary">
            <UserRound size={16} />
            Account profile
          </button>
        </div>
      </div>
      <Modal
        open={!!open}
        onClose={() => setOpen(null)}
        title={
          open === "password"
            ? "Change password"
            : open === "notifications"
              ? "Notification settings"
              : "Account profile"
        }
      >
        <p className="text-sm leading-6 text-slate-500">
          {open === "password"
            ? "Password changes are managed by the LifeLog account service and are not available from this screen yet."
            : "These preferences are local display settings. Your account profile is loaded from the authenticated LifeLog API."}
        </p>
        <button onClick={() => setOpen(null)} className="btn-primary mt-5">
          Close
        </button>
      </Modal>
    </div>
  );
}
