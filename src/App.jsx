import React, { useState, useEffect } from 'react'
import WallpaperGrid from './components/WallpaperGrid'
import ApiKeyForm from './components/ApiKeyForm'
import NavBar from './components/NavBar'

function SignInModal({ onClose, onSign }) {
  return (
    <div className="modal">
      <div className="modal-card">
        <h3>Sign in</h3>
        <p>Use a quick mock sign-in (client-side only) for demo purposes.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => onSign({ provider: 'google', name: 'Google User' })} className="btn">Sign in with Google</button>
          <button onClick={() => onSign({ provider: 'apple', name: 'Apple User' })} className="btn">Sign in with Apple</button>
        </div>
        <div style={{ marginTop: 12 }}>
          <button onClick={onClose} className="btn">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState('home')
  const [category, setCategory] = useState('nature')
  const [showSignIn, setShowSignIn] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    try { const u = JSON.parse(window.localStorage.getItem('wallaura_user') || 'null'); setUser(u) } catch (e) {}
  }, [])

  const handleSignIn = (u) => {
    const user = { id: Date.now(), name: u.name, provider: u.provider }
    window.localStorage.setItem('wallaura_user', JSON.stringify(user))
    setUser(user)
    setShowSignIn(false)
  }

  const handleLogout = () => {
    window.localStorage.removeItem('wallaura_user')
    setUser(null)
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="header-row">
            <div className="brand">
              <h1>WallAura</h1>
              <p className="tag">Beautiful wallpapers, curated for your desktop</p>
            </div>

            <div className="controls">
              <div className="search">
                <input
                  placeholder="Search wallpapers (e.g., nature, abstract)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <ApiKeyForm />
            </div>
          </div>
        </header>
      </div>

      <NavBar mode={mode} setMode={setMode} user={user} onLogin={() => setShowSignIn(true)} onLogout={handleLogout} setCategory={setCategory} />

      <main className="container">
        <WallpaperGrid query={query} mode={mode} category={category} />
      </main>

      <footer className="footer">© {new Date().getFullYear()} WallAura</footer>

      {showSignIn && <SignInModal onClose={() => setShowSignIn(false)} onSign={handleSignIn} />}
    </div>
  )
}
