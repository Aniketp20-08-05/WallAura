import React, { useState, useEffect } from 'react'

export default function NavBar({ mode, setMode, user, onLogin, onLogout, setCategory }) {
  const categories = ['Nature', 'Abstract', 'Space', 'Minimal', 'Cityscape', 'Textures']

  return (
    <div className="navbar">
      <div className="nav-left">
        <div className="brand-small">WallAura</div>
        <button className={`nav-btn ${mode === 'home' ? 'active' : ''}`} onClick={() => setMode('home')}>Explore</button>

        <div className="nav-dropdown">
          <button className={`nav-btn ${mode === 'categories' ? 'active' : ''}`} onClick={() => setMode('categories')}>Categories ▾</button>
          <div className="dropdown">
            {categories.map((c) => (
              <div key={c} className="dropdown-item" onClick={() => { setCategory(c.toLowerCase()); setMode('categories') }}>{c}</div>
            ))}
          </div>
        </div>

        <button className={`nav-btn ${mode === 'favs' ? 'active' : ''}`} onClick={() => setMode('favs')}>Favorites</button>
        <button className={`nav-btn ${mode === 'liked' ? 'active' : ''}`} onClick={() => setMode('liked')}>Liked</button>
      </div>
      <div className="nav-right">
        {user ? (
          <>
            <span className="nav-user">{user.name}</span>
            <button className="nav-btn" onClick={onLogout}>Logout</button>
          </>
        ) : (
          <button className="nav-btn" onClick={onLogin}>Sign in</button>
        )}
      </div>
    </div>
  )
}
