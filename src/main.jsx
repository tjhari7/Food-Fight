import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { router } from './router.jsx'
import { DataProvider } from './context/DataContext.jsx'

// DataProvider sits above the router rather than inside it: it uses no router
// hooks, and RouterProvider takes a prebuilt router instead of children.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DataProvider>
      <RouterProvider router={router} />
    </DataProvider>
  </StrictMode>,
)
