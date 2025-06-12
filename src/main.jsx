import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
// import App from './App.jsx' // App will be rendered by the router
import { RouterProvider } from 'react-router-dom'; // Added RouterProvider
import router from './router/router.jsx'; // Imported the router

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} /> {/* Used RouterProvider */}
  </StrictMode>,
)
