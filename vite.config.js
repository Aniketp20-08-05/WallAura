import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use BASE env var (or PUBLIC_URL) to set base when deploying to a project page
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: process.env.BASE || process.env.PUBLIC_URL || '/',
  }
})
