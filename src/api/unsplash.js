// Simple Unsplash API wrapper. Uses Vite env var VITE_UNSPLASH_ACCESS_KEY.
// If no key is provided, callers should fall back to local/sample data.

// Read and sanitize the env value: remove surrounding quotes and trim whitespace.
const rawAccessKey = import.meta.env.VITE_UNSPLASH_ACCESS_KEY
const ACCESS_KEY = rawAccessKey ? String(rawAccessKey).replace(/^['"]|['"]$/g, '').trim() : rawAccessKey

// Also allow a runtime key to be provided via localStorage so users can paste a key
// in the browser without editing `.env` or restarting the dev server.
function getRuntimeKey() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    const v = window.localStorage.getItem('wallaura_unsplash_key')
    return v ? String(v).replace(/^['"]|['"]$/g, '').trim() : null
  } catch (e) {
    return null
  }
}

function effectiveKey() {
  const runtime = getRuntimeKey()
  return runtime || ACCESS_KEY
}

// Helper to partially mask key for logs (don't print full secret)
function maskKey(k) {
  if (!k) return '<<none>>'
  return k.length > 8 ? `${k.slice(0, 4)}...${k.slice(-4)}` : '****'
}
const BASE = 'https://api.unsplash.com'

async function fetchPhotos({ query, perPage = 20 }) {
  // Treat common placeholder/example values as "no key" so the app falls back
  // to sample data instead of attempting a request with an invalid key.
  const key = effectiveKey()
  if (!key || String(key).toLowerCase().includes('your_') || String(key).toLowerCase().includes('placeholder')) {
    // Signal to caller that no key is present
    throw new Error('NO_UNSPLASH_KEY')
  }

  const headers = {
    Authorization: `Client-ID ${key}`
  }

  const url = query
    ? `${BASE}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`
    : `${BASE}/photos?per_page=${perPage}`

  const res = await fetch(url, { headers })

  if (!res.ok) {
    const text = await res.text()
    const err = new Error('Unsplash API error: ' + res.status + ' ' + res.statusText)
    err.detail = text
    throw err
  }

  const data = await res.json()

  // Helpful debug log during development
  try {
    console.debug('[unsplash] fetched', url, 'results:', (Array.isArray(data) ? data.length : (data.results ? data.results.length : 'unknown')),
      'key:', maskKey(ACCESS_KEY))
  } catch (e) {
    /* ignore logging errors */
  }

  const results = query ? data.results : data

  // Map to our wallpaper shape
  return results.map((p) => ({
    id: p.id,
    title: p.description || p.alt_description || 'Untitled',
    src: p.urls?.regular || p.urls?.full || p.urls?.small,
    author: p.user?.name || p.user?.username,
    download: p.links?.download || p.urls?.full
  }))
}

export { fetchPhotos }

// Follow Unsplash download workflow: call the photo's download_location endpoint
// (or /photos/:id/download) with the app's client id to get a redirected URL to the
// actual image. Returns the final URL string.
async function fetchDownloadUrl({ id, download_location }) {
  const key = effectiveKey()
  if (!key || String(key).toLowerCase().includes('your_')) {
    throw new Error('NO_UNSPLASH_KEY')
  }

  const endpoint = download_location || `${BASE}/photos/${id}/download`
  const headers = { Authorization: `Client-ID ${key}` }

  const res = await fetch(endpoint, { headers })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const err = new Error('Unsplash download endpoint error: ' + res.status + ' ' + res.statusText + ' ' + text)
    err.detail = text
    throw err
  }

  // Response is expected to be JSON containing a url field to the image
  const data = await res.json()
  if (data && data.url) return data.url

  // As a fallback, return the endpoint (may be a redirect)
  return endpoint
}

export { fetchDownloadUrl }
