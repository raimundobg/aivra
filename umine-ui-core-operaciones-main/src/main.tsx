import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AppShell } from './app/AppShell'
import './index.css'
import './i18n'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppShell />
  </StrictMode>,
)
