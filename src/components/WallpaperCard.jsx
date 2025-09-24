import React, { useState, useEffect } from 'react'
import { fetchDownloadUrl } from '../api/unsplash'

export default function WallpaperCard({ wallpaper }) {
  const [saving, setSaving] = useState(false)
  const [fav, setFav] = useState(false)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    try {
      const f = JSON.parse(window.localStorage.getItem('wallaura_favs') || '[]')
      setFav(f.includes(wallpaper.id))
    } catch (e) {
      // ignore
    }
    try {
      const l = JSON.parse(window.localStorage.getItem('wallaura_likes') || '[]')
      setLiked(l.includes(wallpaper.id))
    } catch (e) {
      // ignore
    }
  }, [wallpaper.id])

  const toggleFav = () => {
    try {
      const raw = JSON.parse(window.localStorage.getItem('wallaura_favs') || '[]')
      const set = new Set(raw)
      if (set.has(wallpaper.id)) set.delete(wallpaper.id)
      else set.add(wallpaper.id)
      const arr = Array.from(set)
      window.localStorage.setItem('wallaura_favs', JSON.stringify(arr))
      // notify other components that favorites changed
      try { window.dispatchEvent(new Event('wallaura:favs-changed')) } catch (e) { /* ignore */ }
      setFav(!fav)
    } catch (e) {
      console.error('fav toggle', e)
    }
  }

  const toggleLike = () => {
    try {
      const raw = JSON.parse(window.localStorage.getItem('wallaura_likes') || '[]')
      const set = new Set(raw)
      if (set.has(wallpaper.id)) set.delete(wallpaper.id)
      else set.add(wallpaper.id)
      const arr = Array.from(set)
      window.localStorage.setItem('wallaura_likes', JSON.stringify(arr))
      try { window.dispatchEvent(new Event('wallaura:likes-changed')) } catch (e) { /* ignore */ }
      setLiked(!liked)
    } catch (e) {
      console.error('like toggle', e)
    }
  }

  const download = async () => {
    try {
      setSaving(true)
      // Use Unsplash download workflow when possible to respect tracking requirements,
      // but don't attempt to fetch blobs client-side. Open the resulting URL in a new tab
      // so the user can download manually (avoids CORS issues).
      let targetUrl = wallpaper.download || wallpaper.src
      try {
        if (wallpaper.id) {
          targetUrl = await fetchDownloadUrl({ id: wallpaper.id, download_location: wallpaper.download })
        }
      } catch (e) {
        console.debug('Unsplash download workflow failed, falling back to image URL', e)
        targetUrl = wallpaper.download || wallpaper.src
      }

      if (!targetUrl) throw new Error('No image URL to open')

      // Open in new tab/browser window. Let the browser handle saving.
      window.open(targetUrl, '_blank', 'noopener')
    } catch (err) {
      console.error('Open-in-tab failed', err)
      alert('Unable to open image in a new tab. See console for details.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <img src={wallpaper.src} alt={wallpaper.title} loading="lazy" />
      <div className="meta">
        <div>
          <h3>{wallpaper.title}</h3>
          <p className="author">by {wallpaper.author}</p>
        </div>
        <div className="actions">
          <button onClick={toggleLike} className={`fav like ${liked ? 'liked' : ''}`}>{liked ? '♥' : '♡'}</button>
          <button onClick={toggleFav} className={`fav ${fav ? 'active' : ''}`}>{fav ? '★' : '☆'}</button>
          <button onClick={download} className="download" disabled={saving}>{saving ? 'Opening…' : 'Open'}</button>
        </div>
      </div>
    </div>
  )
}
