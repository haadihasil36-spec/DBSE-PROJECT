import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";
import Activities from "./pages/Activities";
import Study from "./pages/Study";
import Expenses from "./pages/Expenses";
import Food from "./pages/Food";
import Transport from "./pages/Transport";
import ScreenTime from "./pages/ScreenTime";
import MoodSleep from "./pages/MoodSleep";
import Goals from "./pages/Goals";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Progress from "./pages/Progress";
import Auth from "./pages/Auth";
import { useAuth } from "./data/AuthContext";

function Protected({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? children : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<Auth/>}/>
    <Route path="/register" element={<Auth/>}/>
    <Route path="*" element={<Protected><Layout><Routes>
      <Route path="/" element={<Dashboard/>}/>
      <Route path="/timeline" element={<Timeline/>}/>
      <Route path="/activities" element={<Activities/>}/>
      <Route path="/study" element={<Study/>}/>
      <Route path="/expenses" element={<Expenses/>}/>
      <Route path="/food" element={<Food/>}/>
      <Route path="/transport" element={<Transport/>}/>
      <Route path="/screen-time" element={<ScreenTime/>}/>
      <Route path="/mood-sleep" element={<MoodSleep/>}/>
      <Route path="/goals" element={<Goals/>}/>
      <Route path="/analytics" element={<Analytics/>}/>
      <Route path="/progress" element={<Progress/>}/>
      <Route path="/settings" element={<Settings/>}/>
      <Route path="*" element={<Navigate to="/" replace/>}/>
    </Routes></Layout></Protected>}/>
  </Routes>;
}
