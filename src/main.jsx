import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { LifeLogProvider } from "./data/LifeLogContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <LifeLogProvider><App /></LifeLogProvider>
    </BrowserRouter>
  </React.StrictMode>
);