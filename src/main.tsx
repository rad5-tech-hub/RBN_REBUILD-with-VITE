import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "../src/index.css"
import App from './App.tsx'
import "./assets/tailwind/exports.css"

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
