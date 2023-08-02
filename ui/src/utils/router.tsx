import App from '../App';
import Login from '../components/login/login';

import { createBrowserRouter } from "react-router-dom";
const router = createBrowserRouter([{
    path: "/",
    element: <App></App>,
  }, {
    path: "/login",
    element: <Login></Login>,
  }])

  export default router;
