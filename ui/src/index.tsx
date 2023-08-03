import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import "./index.less";
import router from "./utils/router";
import { AuthProvider} from './utils/AuthContext'

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>,
);
