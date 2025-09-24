import React, { useMemo, useEffect, useState, useRef } from 'react'
import WallpaperCard from './WallpaperCard'
import { fetchPhotos } from '../api/unsplash'

// Sample dataset using Unsplash images. Used as a fallback when no API key is set.
const SAMPLE_WALLPAPERS = [
  {
    id: '1',
    title: 'Aurora Over Mountains',
    src: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80&auto=format&fit=crop',
    author: 'Unsplash'
  },
  {
    id: '2',
    title: 'Calm Lake Reflection',
    src: 'https://images.unsplash.com/photo-1501785888041-1670d6c5e2a6?w=1600&q=80&auto=format&fit=crop',
    author: 'Unsplash'
  },
  {
    id: '3',
    title: 'Abstract Color Flow',
    src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1600&q=80&auto=format&fit=crop',
    author: 'Unsplash'
  },
  {
    id: '4',
    title: 'Golden Forest',
    src: 'https://images.unsplash.com/photo-1501785888041-2e48ac0716f5?w=1600&q=80&auto=format&fit=crop',
    author: 'Unsplash'
  },
  {
    id: '5',
    title: 'Minimal Gradient',
    src: 'https://images.unsplash.com/photo-1503264116251-35a269479413?w=1600&q=80&auto=format&fit=crop',
    author: 'Unsplash'
  }
]

export default function WallpaperGrid({ query, mode = 'home', category = 'nature' }) {
  const [wallpapers, setWallpapers] = useState(SAMPLE_WALLPAPERS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [noKeyNotice, setNoKeyNotice] = useState(false)
  const [showFavs, setShowFavs] = useState(false)
  const [favIds, setFavIds] = useState(new Set())
  const [likedIds, setLikedIds] = useState(new Set())

  const debounceRef = useRef(null)

  useEffect(() => {
    // keep favorites in sync when other components update localStorage
    const updateFavs = () => {
      try {
        const raw = JSON.parse(window.localStorage.getItem('wallaura_favs') || '[]')
        setFavIds(new Set(raw))
      } catch (e) {
        setFavIds(new Set())
      }
    }
    const updateLikes = () => {
      try { const raw = JSON.parse(window.localStorage.getItem('wallaura_likes') || '[]'); setLikedIds(new Set(raw)) } catch (e) { setLikedIds(new Set()) }
    }
    updateFavs()
    updateLikes()
    window.addEventListener('wallaura:favs-changed', updateFavs)
    window.addEventListener('wallaura:likes-changed', updateLikes)
    return () => {
      window.removeEventListener('wallaura:favs-changed', updateFavs)
      window.removeEventListener('wallaura:likes-changed', updateLikes)
    }
  }, [])

  useEffect(() => {
    // Determine which query to use: category when in categories mode, otherwise the search query
    const fetchQuery = mode === 'categories' ? (category || '') : (query || '')

    // Cancel previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)

    // Debounce search to avoid spamming API
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setError(null)

      try {
        // If there's no fetch query and we're not in home mode, still attempt a generic fetch
        const photos = await fetchPhotos({ query: fetchQuery, perPage: 24 })
        setWallpapers(photos)
        setNoKeyNotice(false)
        console.debug('[WallpaperGrid] fetched', photos.length, 'photos from API for', fetchQuery)
      } catch (err) {
        // If there is no API key, fall back to sample dataset
        if (err && err.message === 'NO_UNSPLASH_KEY') {
          setWallpapers(
            fetchQuery
              ? SAMPLE_WALLPAPERS.filter((w) => w.title.toLowerCase().includes(fetchQuery.toLowerCase()))
              : SAMPLE_WALLPAPERS
          )
          setNoKeyNotice(true)
        } else {
          // Show more detail when available
          const detail = err.detail || err.message || 'Unknown error'
          setError(detail)
          console.error('[WallpaperGrid] Unsplash error:', detail)
        }
      } finally {
        setLoading(false)
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, mode, category])

  // Listen for runtime API key changes and refetch immediately
  useEffect(() => {
    const handler = () => {
      // trigger a refetch by reusing the effect: set loading and call fetchPhotos directly
      ;(async () => {
        setLoading(true)
        setError(null)
        try {
          const fetchQuery = mode === 'categories' ? (category || '') : (query || '')
          const photos = await fetchPhotos({ query: fetchQuery, perPage: 24 })
          setWallpapers(photos)
          setNoKeyNotice(false)
        } catch (err) {
          if (err && err.message === 'NO_UNSPLASH_KEY') {
            const fetchQuery = mode === 'categories' ? (category || '') : (query || '')
            setWallpapers(fetchQuery ? SAMPLE_WALLPAPERS.filter((w) => w.title.toLowerCase().includes(fetchQuery.toLowerCase())) : SAMPLE_WALLPAPERS)
            setNoKeyNotice(true)
          } else {
            const detail = err.detail || err.message || 'Unknown error'
            setError(detail)
            console.error('[WallpaperGrid] Unsplash error (on key change):', detail)
          }
        } finally {
          setLoading(false)
        }
      })()
    }

    window.addEventListener('wallaura:key-changed', handler)
    return () => window.removeEventListener('wallaura:key-changed', handler)
  }, [query])
  // Decide which items to render based on the current mode
  let displayed = wallpapers
  if (mode === 'favs') displayed = wallpapers.filter((w) => favIds.has(w.id))
  else if (mode === 'liked') displayed = wallpapers.filter((w) => likedIds.has(w.id))
  else if (mode === 'categories') {
    // For demo: filter by the provided category prop
    displayed = wallpapers.filter((w) => (w.title || '').toLowerCase().includes((category || '').toLowerCase()))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          {loading ? <strong>Searching…</strong> : <strong>Wallpapers</strong>}
          {noKeyNotice && <span style={{ marginLeft: 12, color: '#888' }}>Using sample wallpapers (no Unsplash API key)</span>}
          {error && <span style={{ marginLeft: 12, color: 'crimson' }}>Error: {error}</span>}
        </div>
        <div>
          {mode === 'home' && <button onClick={() => { setShowFavs(!showFavs) }} className="btn">{showFavs ? 'Show all' : `Show favorites (${favIds.size})`}</button>}
          {mode === 'categories' && (
            <span className="btn">{category}</span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid">
          {Array.from({ length: 12 }).map((_, i) => (
            <div className="card skeleton" key={`s-${i}`}>
              <div className="s-img" />
              <div className="meta">
                <div>
                  <h3 className="s-line" />
                  <p className="author s-line" />
                </div>
                <div className="actions">
                  <button className="fav s-dot" />
                  <button className="download s-dot" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid">
            {displayed.map((w) => (
              <WallpaperCard key={w.id} wallpaper={w} />
            ))}
          </div>

          {displayed.length === 0 && !loading && !error && (
            <div className="empty">{showFavs ? 'No favorites yet. Click the ☆ on any wallpaper to save it.' : 'No wallpapers found.'}</div>
          )}
        </>
      )}
    </div>
  )
}
