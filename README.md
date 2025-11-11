# Sky Tracker

We (Keis Aissaoui & Tristan Hardouin) built a live flight tracker with a 3D map, Supabase auth, and a small forum to chat about routes.

## Tech Stack (short version)
- Frontend: React + Vite + Tailwind + Three.js for the globe.
- Backend: Node.js + Express with cached calls to OpenSky and PlaneSpotters.
- Database/Auth: Supabase (Postgres + RLS) for users, sessions, favorites, threads, and messages.
- Tooling: npm scripts with nodemon + concurrently for local dev.

## Prerequisites & Local Run
1) Node.js 18+ and npm installed.  
2) Clone the repo, then install deps:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```
3) Copy envs and fill your keys:
```bash
cp .env.example .env          # add OpenSky creds
# also add Supabase URL + keys (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) if you want full auth locally
```
4) Start everything:
```bash
npm run dev
# frontend: http://localhost:5173 (uses backend proxy)
# backend API: http://localhost:3000
```

## User Guide (student edition)
- Sign up or log in (demo admin: `admin@skytracker.dev` / `FlyAdmin!2025`).
- Public pages: browse the home table, filter by callsign/country/altitude/speed, and hop to the interactive map.
- Dashboard (after login): save/un-save favorites, toggle active status, and check the admin panel if your role allows.
- Forum: read threads about flights or UX, post messages when signed in, and see reactions.
- Live data: positions auto-refresh; photos/metadata come from PlaneSpotters when available.
