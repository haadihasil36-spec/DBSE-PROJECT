import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, AUTH_FAILURE_EVENT, clearToken, getToken, setToken } from "../services/api";

const AuthCtx = createContext(null);

function clientUser(user) {
  const name = user.full_name || "LifeLog user";
  return {
    id: user.user_id,
    user_id: user.user_id,
    name,
    email: user.email,
    initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    localStorage.removeItem("lifelog-local-accounts-v1");
    localStorage.removeItem("lifelog-local-session-v1");
    localStorage.removeItem("lifelog-local-data-v2");
    if (!getToken()) {
      setLoading(false);
      return () => { active = false; };
    }

    api.auth.me()
      .then(({ user: restoredUser }) => {
        if (active) setUser(clientUser(restoredUser));
      })
      .catch((error) => {
        if (!active) return;
        if (error.status === 401) clearToken();
        setUser(null);
        setAuthError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const onAuthenticationFailure = () => {
      clearToken();
      setUser(null);
      setAuthError("Your session has expired. Please log in again.");
    };
    window.addEventListener(AUTH_FAILURE_EVENT, onAuthenticationFailure);
    return () => window.removeEventListener(AUTH_FAILURE_EVENT, onAuthenticationFailure);
  }, []);

  async function login(email, password) {
    setAuthError("");
    try {
      const result = await api.auth.login({ email, password });
      setToken(result.token);
      setUser(clientUser(result.user));
      return { ok: true };
    } catch (error) {
      setAuthError(error.message);
      return { ok: false, message: error.message };
    }
  }

  async function register(name, email, password) {
    setAuthError("");
    try {
      await api.auth.register({ full_name: name, email, password });
      return { ok: true, requiresLogin: true };
    } catch (error) {
      setAuthError(error.message);
      return { ok: false, message: error.message };
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    setAuthError("");
  }

  const value = useMemo(() => ({ user, loading, authError, login, register, logout }), [user, loading, authError]);
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const value = useContext(AuthCtx);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
