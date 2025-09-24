// Small proxy to avoid CORS when downloading images.
// Usage: GET /proxy?url=<encoded_url>

const express = require('express')
const fetch = require('node-fetch')
const app = express()
const PORT = process.env.PORT || 4000

app.get('/proxy', async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).send('Missing url param')

  try {
  // decode in case the client encoded the URL
  const decoded = decodeURIComponent(url)
  const r = await fetch(decoded)
    if (!r.ok) return res.status(r.status).send(await r.text())

    // copy headers we care about
    res.set('Content-Type', r.headers.get('content-type') || 'application/octet-stream')
    res.set('Cache-Control', 'public, max-age=31536000')

    r.body.pipe(res)
  } catch (err) {
    console.error('proxy error', err)
    res.status(500).send('proxy error')
  }
})

app.listen(PORT, () => console.log(`Proxy server running on http://localhost:${PORT}`))
