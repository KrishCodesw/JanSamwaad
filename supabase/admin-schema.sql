-- Additional tables and functions for admin portal
-- Run this after the main schema

-- Add description field to departments
alter table public.departments add column if not exists description text;

-- Government Announcements table
create table if not exists public.announcements (
  id bigserial primary key,
  title text not null,
  content text not null,
  type text not null default 'general', -- 'general', 'maintenance', 'alert', 'info'
  priority text not null default 'normal', -- 'low', 'normal', 'high', 'urgent'
  department_id bigint references public.departments(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index announcements_active_idx on public.announcements (is_active, created_at desc);
create index announcements_priority_idx on public.announcements (priority);

-- Issue assignments with more detail
create table if not exists public.assignments (
  issue_id bigint primary key references public.issues(id) on delete cascade,
  department_id bigint not null references public.departments(id) on delete restrict,
  assignee_id uuid references public.profiles(id) on delete set null,
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  estimated_completion timestamptz,
  notes text
);

-- Function to automatically assign role based on email domain
create or replace function public.auto_assign_role()
returns trigger as $$
declare
  user_email text;
begin
  -- Get the email from auth.users
  select email into user_email from auth.users where id = new.id;
  
  if user_email is not null then
    -- Check for government emails
    if user_email like '%@nic.in' or user_email like '%@gov.in' then
      new.role := 'official';
    elsif user_email like '%admin%' then
      new.role := 'admin';
    else
      new.role := 'citizen';
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Update the profile creation trigger
drop trigger if exists on_auth_user_created on auth.users;

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name) 
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add trigger to auto-assign role on profile insert/update
drop trigger if exists auto_role_trigger on public.profiles;
create trigger auto_role_trigger
  before insert or update on public.profiles
  for each row execute procedure public.auto_assign_role();

-- Enhanced RPC for admin statistics
create or replace function public.get_admin_stats()
returns json
language sql stable as $$
  select json_build_object(
    'total_issues', (select count(*) from public.issues),
    'active_issues', (select count(*) from public.issues where status = 'active'),
    'in_progress_issues', (select count(*) from public.issues where status = 'under_progress'),
    'under_review_issues', (select count(*) from public.issues where status = 'under_review'),
    'closed_issues', (select count(*) from public.issues where status = 'closed'),
    'flagged_issues', (select count(*) from public.issues where flagged = true),
    'total_votes', (select count(*) from public.votes),
    'issues_by_category', (
      select json_object_agg(category, count)
      from (
        select unnest(tags) as category, count(*) as count
        from public.issues
        where array_length(tags, 1) > 0
        group by category
        order by count desc
      ) t
    ),
    'issues_by_status', (
      select json_object_agg(status, count)
      from (
        select status, count(*) as count
        from public.issues
        group by status
      ) t
    ),
    'recent_issues_trend', (
      select json_agg(json_build_object('date', date, 'count', count))
      from (
        select date_trunc('day', created_at)::date as date, count(*) as count
        from public.issues
        where created_at >= now() - interval '30 days'
        group by date
        order by date
      ) t
    )
  )
$$;

-- RPC for getting issues with additional admin info
create or replace function public.get_admin_issues(
  status_filter text default null,
  category_filter text default null,
  limit_count int default 100
)
returns setof json
language sql stable as $$
  select json_build_object(
    'id', i.id,
    'description', i.description,
    'status', i.status,
    'tags', i.tags,
    'flagged', i.flagged,
    'latitude', i.latitude,
    'longitude', i.longitude,
    'created_at', i.created_at,
    'updated_at', i.updated_at,
    'reporter_email', i.reporter_email,
    'vote_count', (select count(*) from public.votes v where v.issue_id = i.id),
    'images', (select array_agg(url) from public.issue_images img where img.issue_id = i.id),
    'assignment', (
      select json_build_object(
        'department', d.name,
        'assignee_email', (select email from auth.users where id = a.assignee_id),
        'assigned_at', a.assigned_at,
        'notes', a.notes
      )
      from public.assignments a
      join public.departments d on d.id = a.department_id
      where a.issue_id = i.id
    )
  )
  from public.issues i
  where (status_filter is null or i.status = status_filter)
    and (category_filter is null or category_filter = ANY(i.tags))
  order by i.flagged desc, i.created_at desc
  limit limit_count
$$;

-- Enable RLS and policies for new tables
alter table public.announcements enable row level security;

-- Announcements readable by everyone, writable by officials/admins
create policy "announcements: read all" on public.announcements
  for select using (is_active = true);

create policy "announcements: write by officials" on public.announcements
  for all using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('official', 'admin'))
  );

-- Update issues policies to allow status updates by officials
create policy "issues: update by officials" on public.issues
  for update using (
    exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('official', 'admin'))
  );
