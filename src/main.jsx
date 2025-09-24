import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// If a Vite env key is present and not a placeholder, copy it to localStorage so
// the runtime ApiKeyForm and fetch code can use it without requiring manual paste.
try {
  const raw = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
  if (raw && typeof window !== 'undefined' && window.localStorage) {
    const cleaned = String(raw).replace(/^['"]|['"]$/g, '').trim()
    if (cleaned && !cleaned.toLowerCase().includes('your_') && !cleaned.toLowerCase().includes('placeholder')) {
      window.localStorage.setItem('wallaura_unsplash_key', cleaned)
      // notify components that key changed
      window.dispatchEvent(new Event('wallaura:key-changed'))
      console.debug('[main] loaded VITE_UNSPLASH_ACCESS_KEY into localStorage (masked):', cleaned.slice(0,4) + '...' + cleaned.slice(-4))
    }
  }
} catch (e) {
  // ignore
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
