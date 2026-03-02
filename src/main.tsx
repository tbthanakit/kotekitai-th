import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom' // 1. นำเข้า BrowserRouter
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 2. เอา BrowserRouter มาครอบ App ไว้ */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)