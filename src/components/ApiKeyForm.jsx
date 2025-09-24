import React, { useState, useEffect } from 'react'

export default function ApiKeyForm() {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const v = window.localStorage.getItem('wallaura_unsplash_key')
      if (v) setKey(v)
    } catch (e) {
      // ignore
    }
  }, [])

  const save = () => {
    try {
      const cleaned = key ? String(key).replace(/^['"]|['"]$/g, '').trim() : ''
      if (cleaned) window.localStorage.setItem('wallaura_unsplash_key', cleaned)
      else window.localStorage.removeItem('wallaura_unsplash_key')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      // trigger reload of data by dispatching a custom event
      window.dispatchEvent(new Event('wallaura:key-changed'))
    } catch (e) {
      console.error('Failed to save key', e)
    }
  }

  return (
    <div className="apikey-form">
      <input
        aria-label="Unsplash Access Key"
        placeholder="Paste Unsplash Access Key (optional)"
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <button onClick={save}>{saved ? 'Saved' : 'Save'}</button>
    </div>
  )
}
