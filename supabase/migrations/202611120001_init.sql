create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  handicap_index numeric(4,1),
  home_course_id text,
  home_tee_id text,
  created_at timestamptz default now()
);

create table if not exists public.courses (
  id text primary key,
  name text not null,
  city text,
  country text,
  lat numeric,
  lng numeric,
  created_at timestamptz default now()
);

create table if not exists public.course_tees (
  id uuid primary key default uuid_generate_v4(),
  course_id text not null references public.courses(id) on delete cascade,
  tee_id text not null,
  tee_name text not null,
  gender text,
  slope integer not null,
  rating numeric(4,1) not null,
  par_total integer not null,
  yardage_total integer,
  unique(course_id, tee_id)
);

create table if not exists public.course_holes (
  id uuid primary key default uuid_generate_v4(),
  course_id text not null references public.courses(id) on delete cascade,
  tee_id text not null,
  hole_number integer not null check (hole_number between 1 and 18),
  par integer not null,
  yardage integer,
  stroke_index integer not null,
  unique(course_id, tee_id, hole_number)
);

create table if not exists public.competitions (
  id uuid primary key default uuid_generate_v4(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  course_id text not null references public.courses(id),
  tee_id text not null,
  allowance_multiplier numeric(3,2) not null default 1,
  competition_type text not null default 'individual_stableford',
  name text not null,
  starts_at timestamptz not null,
  status text not null default 'scheduled',
  created_at timestamptz default now()
);

create table if not exists public.competition_players (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  handicap_index_snapshot numeric(4,1),
  playing_handicap integer,
  joined_at timestamptz default now(),
  unique(competition_id, user_id)
);

create table if not exists public.hole_scores (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  gross_strokes integer not null check (gross_strokes > 0),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(competition_id, user_id, hole_number)
);

create table if not exists public.invites (
  id uuid primary key default uuid_generate_v4(),
  competition_id uuid not null references public.competitions(id) on delete cascade,
  email text not null,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  accepted_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create or replace function public.competition_leaderboard(p_competition_id uuid)
returns table(user_id uuid, display_name text, points integer, thru integer)
language sql
security definer
as $$
  with score_rollup as (
    select
      hs.user_id,
      count(*)::int as thru,
      coalesce(sum(greatest(0, 2 + (ch.par - hs.gross_strokes))), 0)::int as points
    from public.hole_scores hs
    join public.competitions c on c.id = hs.competition_id
    join public.course_holes ch
      on ch.course_id = c.course_id
      and ch.tee_id = c.tee_id
      and ch.hole_number = hs.hole_number
    where hs.competition_id = p_competition_id
    group by hs.user_id
  )
  select cp.user_id, coalesce(p.display_name, 'Player') as display_name, coalesce(sr.points, 0) as points, coalesce(sr.thru, 0) as thru
  from public.competition_players cp
  left join public.profiles p on p.user_id = cp.user_id
  left join score_rollup sr on sr.user_id = cp.user_id
  where cp.competition_id = p_competition_id
  order by points desc, thru desc;
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_tees enable row level security;
alter table public.course_holes enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_players enable row level security;
alter table public.hole_scores enable row level security;
alter table public.invites enable row level security;

create policy "profiles self read/write" on public.profiles
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "courses read auth" on public.courses for select using (auth.uid() is not null);
create policy "course tees read auth" on public.course_tees for select using (auth.uid() is not null);
create policy "course holes read auth" on public.course_holes for select using (auth.uid() is not null);

create policy "owner crud competitions" on public.competitions
for all using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy "players read competitions" on public.competitions
for select using (exists (select 1 from public.competition_players cp where cp.competition_id = id and cp.user_id = auth.uid()));

create policy "owner and player read comp players" on public.competition_players
for select using (
  user_id = auth.uid() or exists (
    select 1 from public.competitions c where c.id = competition_id and c.owner_user_id = auth.uid()
  )
);
create policy "owner manage comp players" on public.competition_players
for all using (
  exists (select 1 from public.competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
) with check (
  exists (select 1 from public.competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
);

create policy "self write hole scores" on public.hole_scores
for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "players read hole scores" on public.hole_scores
for select using (
  exists (select 1 from public.competition_players cp where cp.competition_id = competition_id and cp.user_id = auth.uid())
);

create policy "owner manage invites" on public.invites
for all using (
  exists (select 1 from public.competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
) with check (
  exists (select 1 from public.competitions c where c.id = competition_id and c.owner_user_id = auth.uid())
);
create policy "invited user can read invite" on public.invites
for select using (auth.uid() is not null);
