-- Privacy-conscious first-party product analytics stored in Supabase.
-- No IP address, email address, form body, or full URL query is stored.

-- Keep account-type counts complete by creating a profile for every new Auth user.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url, role, created_at, updated_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url',
    'user',
    now(),
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_create_profile on auth.users;
create trigger on_auth_user_created_create_profile
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create table if not exists public.analytics_visitors (
  id uuid primary key,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  first_path text,
  first_referrer_host text
);

create table if not exists public.analytics_sessions (
  id uuid primary key,
  visitor_id uuid not null references public.analytics_visitors(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  landing_path text,
  referrer_host text
);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  event_name text not null,
  visitor_id uuid references public.analytics_visitors(id) on delete set null,
  session_id uuid references public.analytics_sessions(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  path text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists analytics_visitors_last_seen_idx
  on public.analytics_visitors(last_seen_at desc);
create index if not exists analytics_sessions_started_idx
  on public.analytics_sessions(started_at desc);
create index if not exists analytics_sessions_user_idx
  on public.analytics_sessions(user_id, started_at desc);
create index if not exists analytics_events_name_time_idx
  on public.analytics_events(event_name, occurred_at desc);
create index if not exists analytics_events_user_time_idx
  on public.analytics_events(user_id, occurred_at desc);
create index if not exists analytics_events_path_time_idx
  on public.analytics_events(path, occurred_at desc);

alter table public.analytics_visitors enable row level security;
alter table public.analytics_sessions enable row level security;
alter table public.analytics_events enable row level security;

-- Analytics writes and reads go through validated server routes only.
-- No anon/authenticated policies are intentionally created.
revoke all on table public.analytics_visitors from anon, authenticated;
revoke all on table public.analytics_sessions from anon, authenticated;
revoke all on table public.analytics_events from anon, authenticated;

grant all privileges on table
  public.analytics_visitors,
  public.analytics_sessions,
  public.analytics_events
to service_role;

grant usage, select on sequence public.analytics_events_id_seq to service_role;

select pg_notify('pgrst', 'reload schema');
