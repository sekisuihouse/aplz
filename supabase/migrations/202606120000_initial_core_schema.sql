-- APLZ core schema for a fresh Supabase project.
-- This migration defines the original app-publishing tables that the
-- request-platform extension migration builds on.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  is_private boolean default false,
  invite_code text unique,
  created_at timestamptz default now()
);

create table if not exists public.apps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  slug text unique not null,
  author_token text,
  file_count integer default 1,
  community_id uuid references public.communities(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  author_name text default 'Anonymous',
  is_public boolean default true,
  version integer default 1,
  last_published_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references public.apps(id) on delete cascade not null,
  body text not null,
  author_name text default 'Anonymous',
  created_at timestamptz default now()
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references public.apps(id) on delete cascade not null,
  usability integer not null check (usability between 1 and 5),
  design integer not null check (design between 1 and 5),
  idea integer not null check (idea between 1 and 5),
  created_at timestamptz default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  app_id uuid references public.apps(id) on delete cascade not null,
  emoji text not null,
  identifier text not null default 'anonymous',
  created_at timestamptz default now(),
  unique(app_id, emoji, identifier)
);

create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  community_id uuid references public.communities(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member',
  joined_at timestamptz default now(),
  unique(community_id, user_id)
);

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  name text default 'default',
  created_at timestamptz default now(),
  last_used_at timestamptz
);

create index if not exists apps_slug_idx on public.apps(slug);
create index if not exists apps_public_created_at_idx on public.apps(is_public, created_at desc);
create index if not exists apps_user_id_idx on public.apps(user_id);
create index if not exists apps_community_id_idx on public.apps(community_id);
create index if not exists comments_app_id_idx on public.comments(app_id, created_at);
create index if not exists ratings_app_id_idx on public.ratings(app_id);
create index if not exists reactions_app_id_idx on public.reactions(app_id);
create index if not exists community_members_user_id_idx on public.community_members(user_id);
create index if not exists api_tokens_token_idx on public.api_tokens(token);
create index if not exists api_tokens_user_id_idx on public.api_tokens(user_id);

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.apps enable row level security;
alter table public.comments enable row level security;
alter table public.ratings enable row level security;
alter table public.reactions enable row level security;
alter table public.community_members enable row level security;
alter table public.api_tokens enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles for select
using (true);

drop policy if exists "Users can upsert own profile" on public.profiles;
create policy "Users can upsert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Public communities are readable" on public.communities;
create policy "Public communities are readable"
on public.communities for select
using (
  is_private = false
  or exists (
    select 1 from public.community_members m
    where m.community_id = id and m.user_id = auth.uid()
  )
);

drop policy if exists "Public apps are readable" on public.apps;
create policy "Public apps are readable"
on public.apps for select
using (
  is_public = true
  or user_id = auth.uid()
  or exists (
    select 1 from public.community_members m
    where m.community_id = community_id and m.user_id = auth.uid()
  )
);

drop policy if exists "App comments are readable with app" on public.comments;
create policy "App comments are readable with app"
on public.comments for select
using (
  exists (
    select 1 from public.apps a
    where a.id = app_id and (
      a.is_public = true
      or a.user_id = auth.uid()
      or exists (
        select 1 from public.community_members m
        where m.community_id = a.community_id and m.user_id = auth.uid()
      )
    )
  )
);

drop policy if exists "App ratings are readable with app" on public.ratings;
create policy "App ratings are readable with app"
on public.ratings for select
using (
  exists (
    select 1 from public.apps a
    where a.id = app_id and (
      a.is_public = true
      or a.user_id = auth.uid()
      or exists (
        select 1 from public.community_members m
        where m.community_id = a.community_id and m.user_id = auth.uid()
      )
    )
  )
);

drop policy if exists "App reactions are readable with app" on public.reactions;
create policy "App reactions are readable with app"
on public.reactions for select
using (
  exists (
    select 1 from public.apps a
    where a.id = app_id and (
      a.is_public = true
      or a.user_id = auth.uid()
      or exists (
        select 1 from public.community_members m
        where m.community_id = a.community_id and m.user_id = auth.uid()
      )
    )
  )
);

drop policy if exists "Users can read own memberships" on public.community_members;
create policy "Users can read own memberships"
on public.community_members for select
using (user_id = auth.uid());

drop policy if exists "Users can read own token metadata" on public.api_tokens;
create policy "Users can read own token metadata"
on public.api_tokens for select
using (user_id = auth.uid());

select pg_notify('pgrst', 'reload schema');
