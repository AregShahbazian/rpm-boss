import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { I18nProvider } from './i18n'
import { applyTheme, readTheme } from './ui/theme'

// Before the first paint, so a light-theme device does not flash white on a
// dark-theme app while React mounts.
applyTheme(readTheme(), document.documentElement)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
)
