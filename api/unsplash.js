// Serverless proxy for Unsplash API. Intended for Vercel/Netlify functions.
// - Set environment variable UNSPLASH_KEY (the secret) in your hosting provider.
// - Client calls /api/unsplash?q=... or /api/unsplash?download_id=... or /api/unsplash&download_location=...

const fetch = global.fetch || require('node-fetch')

module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

    const key = process.env.UNSPLASH_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY
    if (!key) return res.status(500).json({ error: 'Missing server-side UNSPLASH_KEY' })

    const { q, per_page, page, download_id, download_location } = req.query
    const BASE = 'https://api.unsplash.com'

    // Search or list photos
    if (typeof q !== 'undefined') {
      const per = per_page || 20
      const p = page || 1
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
      return res.status(200).json({ results: mapped })
    }

    // Download workflow
    if (download_id || download_location) {
      const endpoint = download_location || `${BASE}/photos/${download_id}/download`
      const r = await fetch(endpoint, { headers: { Authorization: `Client-ID ${key}` } })
      if (!r.ok) {
        const text = await r.text().catch(() => '')
        return res.status(r.status).json({ error: 'Unsplash download endpoint error', detail: text })
      }
      const data = await r.json()
      return res.status(200).json(data)
    }

    // If no recognized query, return a simple photos list
    const listUrl = `${BASE}/photos?per_page=${per_page || 20}`
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
    return res.status(200).json({ results: mapped })
  } catch (err) {
    console.error('api/unsplash error', err)
    return res.status(500).json({ error: 'proxy error' })
  }
}
