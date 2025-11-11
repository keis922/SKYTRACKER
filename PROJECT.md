Project Name: Sky Tracker

Team Members:
Keis Aissaoui
Tristan Hardouin
Me (classmate on the project)

Deployed URL: https://skytracker-delta.vercel.app

1. Concept & User Experience

Key Features (UI/UX)

- Live 3D globe that plots flights in real time with hover cards and quick links to the detailed map.
- Filtering on the homepage by callsign, country, altitude, and speed plus a responsive table view.
- Authenticated dashboard to pin favorite flights, manage them, and jump to an admin view if your role allows it.
- Forum-style thread view reused in the public site and the dashboard so people can react to incidents.


2. Full-Stack Functionality

Briefly describe how you implemented the core requirements. Keep it concise (1-2 sentences per item).

Authentication

 Sign-up implemented
 Sign-in implemented
 Sign-out implemented
 The UI updates based on user state
Notes: Supabase stores users and sessions; the frontend context swaps routes and menus once the bearer token is set or cleared.

Self-Evaluation:: Solid and reliable; only missing polished error toasts when Supabase is slow.

CRUD Operations

Main Resource: Favorites (saved flights)
 Create
 Read
 Update
 Delete
Notes: Express routes wrap Supabase calls so we can toggle active status or hard-delete a favorite without refetching everything.

Self-Evaluation:: Works end-to-end; could add optimistic UI on the dashboard cards.

Data Relationships

Tables Involved: users ↔ sessions ↔ favorites; threads ↔ messages
 Relationship implemented
Notes: Favorites and sessions are linked by user_id; messages reference their thread_id so forum topics stay grouped.
Self-Evaluation:: Schema is clear; I would index more fields for faster flight lookups.

Search & Filtering

 Search implemented
 Filter implemented, available options: callsign search, by country, by altitude floor, by speed floor, sort by altitude/speed
Notes: Homepage filtering is in-memory on the positions payload; could move to query params so links are shareable.

Self-Evaluation:: UX feels good; deep-linking and debounced search would be nice.

External API Integration

API Used: OpenSky Network (https://opensky-network.org) and PlaneSpotters (https://api.planespotters.net)
Data fetched: Live flight states, tracks, airport arrivals/departures, metadata per aircraft, and photos for the cards.
Notes: We cache the OpenSky responses and reuse tokens to avoid hammering their rate limits; photo URLs are sanitized to HTTPS.

Self-Evaluation:: Integration is the core of the app; only pain point is occasional 429s from OpenSky.

3. Engineering & Architecture

Database Schema

Provide a screenshot of your Supabase Table Editor or a text description of your tables and relationships.


Notes: Tables: users, sessions, favorites, threads, messages. users.id is referenced by sessions.user_id and favorites.user_id; threads.id is referenced by messages.thread_id.

Self-Evaluation:: Schema is minimal but covers auth, saved flights, and the mini-forum.

Row Level Security (RLS)

Provide a screenshot of the Supabase Authentication > Policies dashboard showing your active policies. This is mandatory.



Notes: RLS keeps users scoped to their own favorites and sessions; messages/threads are readable by everyone but writable only for authenticated users.

Self-Evaluation:: Policies follow the usual “user_id = auth.uid()” pattern; would like more tests around it.

Server vs. Client Components

Server Component: backend/routes/flights.js - Why? Handles calls to OpenSky, merges cached airport data, and responds with curated flight objects without exposing secrets to the client.

Client Component: frontend/src/public-site/pages/MapPage.jsx - Why? Needs interactive map controls, live polling, and React state to update markers without a reload.

4. Self-Reflection & Feedback

Proudest Achievement

What is the technically most difficult or most polished feature you built?

Keis Aissaoui: The OpenSky caching layer that mixes tokens, airport lookups, and rate-limit handling without breaking the map.

Tristan Hardouin: The 3D globe + dashboard layout with smooth hover states and reusable cards across public and private routes.

Me: Wiring the auth context with protected routes so the dashboard and admin area flip instantly when you log in or out.

What Would You Improve?

If you had more time, what would you add or improve in your project?

Keis Aissaoui: Add better resilience when OpenSky throttles us and queue writes for favorites.

Tristan Hardouin: More map layers (weather/heatmaps) and a mobile-first pass on the forum view.

Me: Shareable filters on the homepage and a lighter loading state for the positions table.
