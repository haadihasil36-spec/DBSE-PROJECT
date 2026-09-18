import { Routes, Route } from "react-router-dom";
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

export default function App() {
  return <Layout><Routes>
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
    <Route path="*" element={<Dashboard/>}/>
  </Routes></Layout>;
}