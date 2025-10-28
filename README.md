# WallAura

A simple React (Vite) wallpaper app starter called WallAura.

Quick start (Windows PowerShell):

```powershell
cd c:\Users\Lenovo\Desktop\WallAura
npm install
npm run dev
```

What you get:
- Vite + React scaffold
- `src/components/WallpaperGrid.jsx` and `WallpaperCard.jsx` sample components
- Simple CSS styles in `src/styles.css`

Unsplash API integration
------------------------
This starter can optionally fetch real wallpapers from the Unsplash API. To enable:

1. Create an Unsplash developer account and register an app to get an Access Key: https://unsplash.com/developers
2. Copy `.env.example` to `.env` and set `VITE_UNSPLASH_ACCESS_KEY`.
3. Restart the dev server. When the key is present the app will fetch search results from Unsplash. If no key is provided the app falls back to the built-in sample images.


Next steps (suggestions):
- Replace the sample Unsplash URLs with a proper API (Unsplash API, Pexels, or your own CDN)
- Add routing, favorites, and user preferences
- Add download as proper file (fetch blob and save) and desktop wallpaper setter (native integrations)

Download behavior
-----------------
The Download button now attempts to fetch the image as a blob and save it automatically to your machine with a filename derived from the image title. Note: some remote image URLs may block direct fetches due to CORS. If an image fails to download, try opening it in a new tab and saving from there, or use a different image/source.

Enjoy building WallAura!

Deploy to GitHub Pages

1. Create a repository on GitHub and push this project to the `main` branch.

Deploy to Vercel (recommended)
------------------------------

To host WallAura where users don't need to paste an Unsplash key, use Vercel and the included serverless proxy:

1. Sign into https://vercel.com and import the GitHub repository `Aniketp20-08-05/WallAura`.
2. During import set:
	- Build command: `npm run vercel-build` (or `npm run build`)
	- Output directory: `dist`
3. Add the required Environment Variables in the Vercel Project Settings → Environment Variables:
	- `UNSPLASH_KEY` = <your Unsplash Access Key>  (keep this secret)
	- `VITE_USE_SERVER_PROXY` = `true`

	Notes:
	- `UNSPLASH_KEY` is used only on the serverless proxy (kept secret).
	- `VITE_USE_SERVER_PROXY` must be `true` at build time so the client will call `/api/unsplash` rather than hitting Unsplash directly.

4. Deploy the project. Vercel will build and publish a public URL (e.g. `https://wallaura-<user>.vercel.app`).

Local testing with Vercel CLI:

```powershell
# install vercel if you don't have it
# npm i -g vercel
# login interactively
# create a local .env file with:
#   UNSPLASH_KEY=your_key
#   VITE_USE_SERVER_PROXY=true
# then run:
# vercel dev
```

If you'd like, I can add more advanced protections (short in-memory cache, per-IP rate limiting) to the serverless proxy — this reduces load on Unsplash and protects your quota.
2. Ensure the repo has a `GITHUB_TOKEN` (provided automatically for Actions).
3. The workflow in `.github/workflows/deploy-pages.yml` will run on push to `main`, build the Vite app, and publish the `dist/` folder to GitHub Pages.
4. After the action completes, enable GitHub Pages in your repository settings (the action will publish to the `gh-pages` branch).

Notes:
- If your site will be served from a project page (username.github.io/repo), set `base` in `vite.config.js` or adjust the `homepage` accordingly so asset URLs resolve correctly.
- For advanced deployments (custom domains, cache headers), extend the Actions workflow.

Build status: ![pages-deploy](https://github.com/<your-username>/<your-repo>/workflows/Build%20and%20deploy%20to%20GitHub%20Pages/badge.svg)
