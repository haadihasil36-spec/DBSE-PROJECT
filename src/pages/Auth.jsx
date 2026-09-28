import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Activity, ArrowRight, BarChart3, Eye, EyeOff, LockKeyhole, Sparkles, Target, TrendingUp } from "lucide-react";
import { useAuth } from "../data/AuthContext";

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mode, setMode] = useState(location.pathname === "/register" ? "register" : "login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  useEffect(() => {
    setMode(location.pathname === "/register" ? "register" : "login");
    setError("");
  }, [location.pathname]);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = mode === "login"
      ? await login(email, password)
      : await register(name, email, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (mode === "register") {
      setPassword("");
      setMode("login");
      navigate("/login", { replace: true, state: { message: "Account created. Sign in with your new credentials." } });
      return;
    }
    navigate(location.state?.from || "/", { replace: true });
  };

  const demo = async () => {
    setError("");
    setLoading(true);
    const result = await login("rahul@lifelog.com", password);
    if (!result.ok) {
      setError(password ? result.message : "Enter the existing demo account password. LifeLog does not bundle demo credentials.");
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate("/", { replace: true });
  };

  return (
    <div className="auth-shell">
      <section className="auth-showcase">
        <div className="auth-orbit orbit-one" />
        <div className="auth-orbit orbit-two" />
        <div className="auth-orbit orbit-three" />
        <div className="auth-brand"><span className="brand-mark"><Activity size={21}/></span><span>LifeLog</span></div>
        <div className="auth-hero">
          <div className="auth-kicker"><Sparkles size={15}/> PERSONAL ACTIVITY INTELLIGENCE</div>
          <h1>Turn everyday moments into <span>better patterns.</span></h1>
          <p>One calm place for your activities, study, spending, sleep, screen time and goals.</p>
          <div className="auth-stat-grid">
            <div><BarChart3 size={18}/><strong>Daily</strong><span>Know what happened.</span></div>
            <div><TrendingUp size={18}/><strong>Weekly</strong><span>See how you changed.</span></div>
            <div><Target size={18}/><strong>Goals</strong><span>Keep moving forward.</span></div>
          </div>
        </div>
        <div className="auth-quote">“Your day. Your data. Your patterns.”</div>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <div className="mobile-brand"><span className="brand-mark"><Activity size={20}/></span>LifeLog</div>
          <div className="auth-heading">
            <span className="auth-mini-icon"><LockKeyhole size={17}/></span>
            <p className="auth-eyebrow">{mode === "login" ? "WELCOME BACK" : "START YOUR LOG"}</p>
            <h2>{mode === "login" ? "Sign in to your LifeLog" : "Create your LifeLog"}</h2>
            <p>{mode === "login" ? "Pick up where you left off and keep your day in focus." : "Build a private activity dashboard for your everyday life."}</p>
          </div>

          <div className="auth-tabs">
            <button type="button" className={mode === "login" ? "active" : ""} onClick={() => {setMode("login"); setError(""); navigate("/login", { replace: true });}}>Sign in</button>
            <button type="button" className={mode === "register" ? "active" : ""} onClick={() => {setMode("register"); setError(""); navigate("/register", { replace: true });}}>Create account</button>
          </div>

          <form onSubmit={submit} className="auth-form">
            {mode === "register" && <label><span>Full name</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required autoComplete="name" /></label>}
            <label><span>Email address</span><input value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" type="email" required autoComplete="email" /></label>
            <label><span>Password</span><div className="password-wrap"><input value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "login" ? "Your password" : "At least 6 characters"} type={showPassword ? "text" : "password"} required autoComplete={mode === "login" ? "current-password" : "new-password"}/><button type="button" onClick={() => setShowPassword(v => !v)} aria-label="Show password">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div></label>
            {location.state?.message && !error && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{location.state.message}</div>}
            {error && <div className="auth-error" role="alert">{error}</div>}
            <button className="auth-submit" disabled={loading}>{loading ? "Opening LifeLog…" : mode === "login" ? <>Enter LifeLog <ArrowRight size={18}/></> : <>Create my LifeLog <ArrowRight size={18}/></>}</button>
          </form>

          {mode === "login" && <>
            <div className="auth-divider"><span>or</span></div>
            <button className="demo-button" onClick={demo}>Continue with demo account <span>rahul@lifelog.com</span></button>
          </>}

          <p className="auth-footnote">Your account is secured by LifeLog’s API. Passwords are never stored in this browser.</p>
        </div>
      </section>
    </div>
  );
}
