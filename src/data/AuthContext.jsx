import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ACCOUNTS_KEY = "lifelog-local-accounts-v1";
const SESSION_KEY = "lifelog-local-session-v1";
const DEMO_ACCOUNT = { id: "demo", name: "Rahul Sharma", email: "rahul@lifelog.com", password: "demo123", initials: "RS" };

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch { return fallback; }
}

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [accounts, setAccounts] = useState(() => {
    const saved = readJSON(ACCOUNTS_KEY, []);
    return saved.some(a => a.email === DEMO_ACCOUNT.email) ? saved : [DEMO_ACCOUNT, ...saved];
  });
  const [user, setUser] = useState(() => readJSON(SESSION_KEY, null));

  useEffect(() => localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)), [accounts]);
  useEffect(() => {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    else localStorage.removeItem(SESSION_KEY);
  }, [user]);

  const login = (email, password) => {
    const account = accounts.find(a => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password);
    if (!account) return { ok: false, message: "Email or password is incorrect." };
    const session = { id: account.id, name: account.name, email: account.email, initials: account.initials || account.name.split(" ").map(x => x[0]).join("").slice(0,2).toUpperCase() };
    setUser(session);
    return { ok: true };
  };

  const register = (name, email, password) => {
    const cleanEmail = email.trim().toLowerCase();
    if (accounts.some(a => a.email.toLowerCase() === cleanEmail)) return { ok: false, message: "An account with this email already exists." };
    if (password.length < 6) return { ok: false, message: "Use at least 6 characters for the password." };
    const account = { id: crypto.randomUUID?.() || String(Date.now()), name: name.trim(), email: cleanEmail, password, initials: name.trim().split(/\s+/).map(x => x[0]).join("").slice(0,2).toUpperCase() };
    setAccounts(prev => [account, ...prev]);
    setUser({ id: account.id, name: account.name, email: account.email, initials: account.initials });
    return { ok: true };
  };

  const logout = () => setUser(null);
  const value = useMemo(() => ({ user, login, register, logout }), [user, accounts]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const value = useContext(AuthCtx);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
