import App from '@/App';
import Chat from '@/components/chat/chat';
import Home from '@/components/home/home';

import { createBrowserRouter } from 'react-router-dom';
const router = createBrowserRouter([
    {
        path: '/',
        element: <App></App>,
    },
    {
        path: '/home',
        element: <Home></Home>,
    },
    {
        path: '/ChatTest',
        element: <Chat />,
    },
]);

export default router;
