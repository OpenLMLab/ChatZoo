import App from '@/App';
import Home from '@/components/home/home'

import { createBrowserRouter } from "react-router-dom";
const router = createBrowserRouter([{
    path: "/",
    element: <App></App>,
  }, {
    path: "/home",
    element: <Home></Home>,
  }])

  export default router;
