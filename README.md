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

Use this harness to verify your key/header format and GolfCourseAPI endpoint/query params are correct:

```bash
GOLFCOURSE_API_KEY=your_key_here npm run test:golfapi
```

Example output:

```text
GolfCourseAPI test harness
API key present: true
API key prefix: abcd***

URL: https://api.golfcourseapi.com/v1/search?search_query=St%20Andrews
HTTP status: 200
Search returned 8 course(s).
First 2 results:
1. id=12345 | club_name=St Andrews Links | course_name=Old Course | city=St Andrews | country=Scotland
2. id=67890 | club_name=... | course_name=... | city=... | country=...

URL: https://api.golfcourseapi.com/v1/courses/12345
HTTP status: 200
Course detail tee sets: 6
Course detail holes count (first tee): 18
```
