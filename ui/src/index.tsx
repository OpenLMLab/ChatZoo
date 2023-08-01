import React from "react";
import ReactDOM from "react-dom/client";
import "./index.less";
import Login from "./components/login/login"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Login />
  </React.StrictMode>,
);
