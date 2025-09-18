-- Supabase schema for Civic Issue Reporting prototype
-- Run in Supabase SQL Editor or CLI. Safe to re-run.

-- Enable PostGIS
create extension if not exists postgis;

-- Enums
do $$ begin
  create type issue_status as enum ('active','under_progress','under_review','closed');
exception when duplicate_object then null end $$;

do $$ begin
  create type user_role as enum ('citizen','official','admin');
exception when duplicate_object then null end $$;

-- Departments
create table if not exists public.departments (
  id bigserial primary key,
  name text not null unique
);

-- Regions mapped to departments for routing
create table if not exists public.regions (
  id bigserial primary key,
  name text not null,
  department_id bigint not null references public.departments(id) on delete restrict,
  boundary geometry(Polygon, 4326) not null
);
create index if not exists regions_gix on public.regions using gist (boundary);

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'citizen',
  department_id bigint references public.departments(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Auto-insert profiles on new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

do $$ begin
  create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
exception when duplicate_object then null end $$;

-- Issues
create table if not exists public.issues (
  id bigserial primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_email text,
  description text not null,
  tags text[] not null default '{}',
  flagged boolean not null default false,
  status issue_status not null default 'active',
  latitude double precision not null,
  longitude double precision not null,
  geom geography(Point, 4326) generated always as (
    st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists issues_geom_gix on public.issues using gist (geom);
create index if not exists issues_status_idx on public.issues (status);
create index if not exists issues_created_at_idx on public.issues (created_at);
create index if not exists issues_flagged_idx on public.issues (flagged) where flagged;

-- Auto update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$ begin
  create trigger trig_set_updated_at
  before update on public.issues
  for each row execute procedure public.set_updated_at();
exception when duplicate_object then null end $$;

-- Issue images (hosted externally)
create table if not exists public.issue_images (
  id bigserial primary key,
  issue_id bigint not null references public.issues(id) on delete cascade,
  url text not null,
  width int,
  height int,
  created_at timestamptz not null default now()
);
create index if not exists issue_images_issue_id_idx on public.issue_images(issue_id);

-- Votes (upvotes)
create table if not exists public.votes (
  id bigserial primary key,
  issue_id bigint not null references public.issues(id) on delete cascade,
  voter_id uuid references public.profiles(id) on delete set null,
  voter_ip_hash text,
  created_at timestamptz not null default now(),
  constraint uniq_issue_voter unique (issue_id, voter_id),
  constraint uniq_issue_iphash unique (issue_id, voter_ip_hash)
);

-- Assignments (routing result)
create table if not exists public.assignments (
  issue_id bigint primary key references public.issues(id) on delete cascade,
  department_id bigint not null references public.departments(id) on delete restrict,
  assignee_id uuid references public.profiles(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now()
);

-- Status transition history
create table if not exists public.status_history (
  id bigserial primary key,
  issue_id bigint not null references public.issues(id) on delete cascade,
  from_status issue_status,
  to_status issue_status not null,
  notes text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

-- RLS
alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.issue_images enable row level security;
alter table public.votes enable row level security;
alter table public.assignments enable row level security;
alter table public.status_history enable row level security;
alter table public.departments enable row level security;
alter table public.regions enable row level security;

-- Profiles: users can read own, admins can read all
create policy if not exists "profiles: self or admin" on public.profiles
for select using (
  auth.uid() = id or exists(
    select 1 from public.profiles p where p.id = auth.uid() and p.role in ('admin')
  )
);

-- Departments and regions readable by anyone
create policy if not exists "departments: read all" on public.departments for select using (true);
create policy if not exists "regions: read all" on public.regions for select using (true);

-- Issues readable by anyone
create policy if not exists "issues: read all" on public.issues for select using (true);

-- Authenticated users can insert issues they own
create policy if not exists "issues: insert own" on public.issues
for insert with check (
  auth.role() = 'authenticated' and reporter_id = auth.uid()
);

-- Officials/Admin can update issues
create policy if not exists "issues: update by officials" on public.issues
for update using (
  exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('official','admin'))
);

-- Images readable by anyone; inserts allowed when adding to an issue they inserted
create policy if not exists "issue_images: read all" on public.issue_images for select using (true);
create policy if not exists "issue_images: insert by issue owner" on public.issue_images
for insert with check (
  auth.role() = 'authenticated' and exists(
    select 1 from public.issues i where i.id = issue_id and i.reporter_id = auth.uid()
  )
);

-- Votes readable by anyone; authenticated users can vote once via (issue_id, voter_id)
create policy if not exists "votes: read all" on public.votes for select using (true);
create policy if not exists "votes: insert auth" on public.votes
for insert with check (
  auth.role() = 'authenticated' and voter_id = auth.uid()
);

-- Assignments and status history readable by anyone
create policy if not exists "assignments: read all" on public.assignments for select using (true);
create policy if not exists "status_history: read all" on public.status_history for select using (true);

-- RPC: issues_nearby
create or replace function public.issues_nearby(in_lng double precision, in_lat double precision, in_radius_m integer default 300)
returns setof public.issues
language sql stable as $$
  select i.*
  from public.issues i
  where st_dwithin(i.geom, st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography, in_radius_m)
  order by i.flagged desc, i.created_at desc
  limit 200
$$;

-- RPC: route_issue_by_point (returns the smallest containing region)
create or replace function public.route_issue_by_point(in_lng double precision, in_lat double precision)
returns table (region_id bigint, department_id bigint)
language sql stable as $$
  select r.id as region_id, r.department_id
  from public.regions r
  where st_contains(r.boundary, st_setsrid(st_makepoint(in_lng, in_lat), 4326))
  order by st_area(r.boundary) asc
  limit 1
$$;

