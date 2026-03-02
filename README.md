# GolfBuddy

GolfBuddy is a mobile-first golf scoring and competition app for **Individual Stableford** with live leaderboard updates.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn-style UI primitives
- Supabase (Auth magic links, Postgres, Realtime)
- Vercel deployment-ready
- Vitest for WHS and Stableford unit tests

## Features included

- Magic-link auth flow with Supabase (`/auth`, `/auth/callback`)
- Protected `/app` routes via middleware
- Profile onboarding fields (display name, handicap index)
- Course search + nearby routes that proxy server-side to GolfCourseAPI:
  - `GET /api/courses/search?q=`
  - `GET /api/courses/nearby?lat=&lng=&radiusKm=`
  - `GET /api/courses/:id`
- In-memory TTL cache for GolfCourseAPI responses
- Competition creation (allowance selector: 100/95/90)
- Invite join route (`POST /api/invites/:inviteId/join`)
- Hole score entry UI and realtime leaderboard subscription
- WHS helper math + Stableford points unit tests
- Supabase SQL migration containing schema + RLS policies + leaderboard SQL function

## Environment variables

Copy `.env.example` and set values locally:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server only)
- `GOLFCOURSE_API_KEY` (server only)
- `NEXT_PUBLIC_SITE_URL` (e.g. `http://localhost:3000`)

No secrets should be committed.

## Supabase setup

1. Create a Supabase project.
2. Enable Email (magic link) in Auth providers.
3. Run SQL migration in `supabase/migrations/202611120001_init.sql`.
4. Add your app URL and callback URL in Supabase Auth settings:
   - `http://localhost:3000/auth/callback`
   - production `https://<your-domain>/auth/callback`

## Local development

```bash
npm install
npm run dev
```

Then visit `http://localhost:3000`.

## Checks

```bash
npm run lint
npm run typecheck
npm run test
```

## Deploy to Vercel

1. Import repository in Vercel.
2. Set all environment variables from `.env.example`.
3. Deploy.
4. Ensure Supabase redirect URLs include your Vercel domain callback path.


## GolfCourseAPI connectivity harness

Use this harness to verify your key/header format and GolfCourseAPI endpoint/query params are correct. It supports:

- direct GolfCourseAPI course/club name search (`/v1/search?search_query=`)
- city/postcode lookup via OpenStreetMap (Nominatim geocoding + Overpass nearby golf courses), then mapping nearby OSM names to GolfCourseAPI IDs for scorecard detail checks

```bash
GOLFCOURSE_API_KEY=your_key_here npm run test:golfapi
```

Examples:

```bash
GOLFCOURSE_API_KEY=your_key_here node scripts/test-golfcourseapi.mjs "St Andrews"
GOLFCOURSE_API_KEY=your_key_here node scripts/test-golfcourseapi.mjs "Harrogate"
GOLFCOURSE_API_KEY=your_key_here node scripts/test-golfcourseapi.mjs "LS17 8BA"
```

Optional radius override for nearby OSM discovery:

```bash
GOLFAPI_NEARBY_RADIUS_METERS=10000 GOLFCOURSE_API_KEY=your_key_here npm run test:golfapi -- "Leeds"
# or
GOLFCOURSE_API_KEY=your_key_here node scripts/test-golfcourseapi.mjs --radius-m 10000 "Leeds"
```

Notes:

- OSM APIs can rate-limit, so keep runs reasonable and avoid tight loops.
- The harness currently maps only the first 10 nearby OSM candidates to GolfCourseAPI to reduce external API load.
- Ensure the GolfCourseAPI auth header format stays exactly `Authorization: Key <API_KEY>`.
