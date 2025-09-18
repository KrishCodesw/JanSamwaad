-- Supabase schema for Civic Issue Reporting prototype
-- Simple version that works reliably in Supabase SQL Editor

-- Enable PostGIS
create extension if not exists postgis;

-- Create enums (simple approach)
create type issue_status as enum ('active','under_progress','under_review','closed');
create type user_role as enum ('citizen','official','admin');

-- Departments
create table public.departments (
  id bigserial primary key,
  name text not null unique
);

-- Profiles (linked to auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  role user_role not null default 'citizen',
  department_id bigint references public.departments(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Issues
create table public.issues (
  id bigserial primary key,
  reporter_id uuid references public.profiles(id) on delete set null,
  reporter_email text,
  description text not null,
  tags text[] not null default '{}',
  flagged boolean not null default false,
  status issue_status not null default 'active',
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Issue images (hosted externally)
create table public.issue_images (
  id bigserial primary key,
  issue_id bigint not null references public.issues(id) on delete cascade,
  url text not null,
  width int,
  height int,
  created_at timestamptz not null default now()
);

-- Votes (upvotes)
create table public.votes (
  id bigserial primary key,
  issue_id bigint not null references public.issues(id) on delete cascade,
  voter_id uuid references public.profiles(id) on delete set null,
  voter_ip_hash text,
  created_at timestamptz not null default now(),
  unique(issue_id, voter_id),
  unique(issue_id, voter_ip_hash)
);

-- Status transition history
create table public.status_history (
  id bigserial primary key,
  issue_id bigint not null references public.issues(id) on delete cascade,
  from_status issue_status,
  to_status issue_status not null,
  notes text,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

-- Create indexes
create index issues_status_idx on public.issues (status);
create index issues_created_at_idx on public.issues (created_at);
create index issues_flagged_idx on public.issues (flagged) where flagged;
create index issue_images_issue_id_idx on public.issue_images(issue_id);

-- Auto-insert profiles on new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Auto update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger trig_set_updated_at
  before update on public.issues
  for each row execute procedure public.set_updated_at();

-- RPC: issues_nearby (simplified without PostGIS for now)
create or replace function public.issues_nearby(in_lng double precision, in_lat double precision, in_radius_m integer default 300)
returns setof public.issues
language sql stable as $$
  select i.*
  from public.issues i
  order by 
    abs(i.latitude - in_lat) + abs(i.longitude - in_lng),
    i.flagged desc, 
    i.created_at desc
  limit 200
$$;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.issues enable row level security;
alter table public.issue_images enable row level security;
alter table public.votes enable row level security;
alter table public.status_history enable row level security;
alter table public.departments enable row level security;

-- Create policies
create policy "profiles: self or admin" on public.profiles
  for select using (auth.uid() = id);

create policy "departments: read all" on public.departments 
  for select using (true);

create policy "issues: read all" on public.issues 
  for select using (true);

create policy "issues: insert anonymous" on public.issues
  for insert with check (true);

create policy "issue_images: read all" on public.issue_images 
  for select using (true);

create policy "issue_images: insert anonymous" on public.issue_images
  for insert with check (true);

create policy "votes: read all" on public.votes 
  for select using (true);

create policy "votes: insert anonymous" on public.votes
  for insert with check (true);

create policy "status_history: read all" on public.status_history 
  for select using (true);

-- Insert sample departments
insert into public.departments (name) values 
  ('Public Works'),
  ('Sanitation'),
  ('Transportation'),
  ('Parks & Recreation'),
  ('Water & Utilities')
on conflict (name) do nothing;
