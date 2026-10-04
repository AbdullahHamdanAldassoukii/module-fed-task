import { useMemo } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { routes } from './router';

export function App() {
  const router = useMemo(() => createBrowserRouter(routes), []);

  return <RouterProvider router={router} />;
}
