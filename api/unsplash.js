// Serverless proxy for Unsplash API. Intended for Vercel/Netlify functions.
// - Set environment variable UNSPLASH_KEY (the secret) in your hosting provider.
// - Client calls /api/unsplash?q=... or /api/unsplash?download_id=... or /api/unsplash&download_location=...

const fetch = global.fetch || require('node-fetch')

// Basic in-memory cache and rate limiter to reduce calls to Unsplash and protect
// the server-side key. This is intentionally simple and suitable for low-to-
// medium traffic. For production-scale usage, use a shared cache (Redis) and
// a robust rate-limiting middleware.

const CACHE_TTL_MS = 30 * 1000 // 30s cache for search/list responses
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute window
const RATE_LIMIT_MAX = 120 // max requests per IP per window

const cache = new Map() // key -> { ts, data }
const rateMap = new Map() // ip -> { windowStart, count }

function getClientIp(req) {
  const xf = req.headers['x-forwarded-for']
  if (xf) return String(xf).split(',')[0].trim()
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : 'unknown'
}

function cacheGet(key) {
  const e = cache.get(key)
  if (!e) return null
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return e.data
}

function cacheSet(key, data) {
  cache.set(key, { ts: Date.now(), data })
}

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    // Simple per-IP rate limiting
    const ip = getClientIp(req)
    const now = Date.now()
    const st = rateMap.get(ip) || { windowStart: now, count: 0 }
    if (now - st.windowStart > RATE_LIMIT_WINDOW_MS) {
      st.windowStart = now
      st.count = 0
    }
    st.count += 1
    rateMap.set(ip, st)
    if (st.count > RATE_LIMIT_MAX) {
      res.setHeader('Retry-After', Math.ceil((st.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000))
      return res.status(429).json({ error: 'Rate limit exceeded' })
    }

    const key = process.env.UNSPLASH_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY
    if (!key) return res.status(500).json({ error: 'Missing server-side UNSPLASH_KEY' })

    const { q, per_page, page, download_id, download_location } = req.query
    const BASE = 'https://api.unsplash.com'

    // Search or list photos
    if (typeof q !== 'undefined') {
      const per = per_page || 20
      const p = page || 1
      const cacheKey = `search:${q}:${per}:${p}`
      const cached = cacheGet(cacheKey)
      if (cached) return res.status(200).json(cached)

      const url = `${BASE}/search/photos?query=${encodeURIComponent(q)}&per_page=${per}&page=${p}`
      const r = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } })
      if (!r.ok) {
        const text = await r.text().catch(() => '')
        return res.status(r.status).json({ error: 'Unsplash search error', detail: text })
      }
      const data = await r.json()
      const results = data.results || []
      // Map to client's expected shape (minimal)
      const mapped = results.map((p) => ({
        id: p.id,
        title: p.description || p.alt_description || 'Untitled',
        src: p.urls?.regular || p.urls?.full || p.urls?.small,
        author: p.user?.name || p.user?.username,
        download: p.links?.download || p.urls?.full,
        raw: p
      }))
      const payload = { results: mapped }
      cacheSet(cacheKey, payload)
      return res.status(200).json(payload)
    }

    // Download workflow
    if (download_id || download_location) {
      const endpoint = download_location || `${BASE}/photos/${download_id}/download`
      const cacheKey = `download:${endpoint}`
      const cached = cacheGet(cacheKey)
      if (cached) return res.status(200).json(cached)

      const r = await fetch(endpoint, { headers: { Authorization: `Client-ID ${key}` } })
      if (!r.ok) {
        const text = await r.text().catch(() => '')
        return res.status(r.status).json({ error: 'Unsplash download endpoint error', detail: text })
      }
      const data = await r.json()
      cacheSet(cacheKey, data)
      return res.status(200).json(data)
    }

    // If no recognized query, return a simple photos list
    const listUrl = `${BASE}/photos?per_page=${per_page || 20}`
    const cacheKey = `list:${per_page || 20}`
    const cached = cacheGet(cacheKey)
    if (cached) return res.status(200).json(cached)

    const r = await fetch(listUrl, { headers: { Authorization: `Client-ID ${key}` } })
    if (!r.ok) {
      const text = await r.text().catch(() => '')
      return res.status(r.status).json({ error: 'Unsplash list error', detail: text })
    }
    const data = await r.json()
    const mapped = (Array.isArray(data) ? data : []).map((p) => ({
      id: p.id,
      title: p.description || p.alt_description || 'Untitled',
      src: p.urls?.regular || p.urls?.full || p.urls?.small,
      author: p.user?.name || p.user?.username,
      download: p.links?.download || p.urls?.full,
      raw: p
    }))
    const payload = { results: mapped }
    cacheSet(cacheKey, payload)
    return res.status(200).json(payload)
  } catch (err) {
    console.error('api/unsplash error', err)
    return res.status(500).json({ error: 'proxy error' })
  }
}
