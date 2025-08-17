import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// removed branded icon package
import './App.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
