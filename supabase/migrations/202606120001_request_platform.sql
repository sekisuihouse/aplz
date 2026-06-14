-- APLZ request platform extension.
-- Existing apps/comments/ratings/reactions tables are intentionally left intact.

create extension if not exists pgcrypto;

alter table public.profiles
  add column if not exists bio text,
  add column if not exists github_url text,
  add column if not exists sns_url text,
  add column if not exists website_url text,
  add column if not exists developer_enabled boolean default false,
  add column if not exists skill_categories text[] default '{}',
  add column if not exists role text default 'user',
  add column if not exists updated_at timestamptz default now();

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  user_id uuid references auth.users(id) on delete set null,
  title text not null,
  category text,
  target_user_type text,
  current_workflow text,
  pain_point text,
  desired_outcome text,
  usage_frequency text,
  input_data text,
  output_data text,
  privacy_level text default 'unknown',
  deadline date,
  reference_url text,
  description text,
  status text default 'open',
  is_public boolean default true,
  is_beginner_friendly boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint requests_status_check check (
    status in ('open', 'questions', 'in_progress', 'answered', 'testing', 'solved', 'on_hold', 'hidden')
  ),
  constraint requests_privacy_check check (
    privacy_level in ('none', 'low', 'medium', 'high', 'unknown')
  )
);

create table if not exists public.solutions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete set null,
  app_id uuid references public.apps(id) on delete set null,
  app_slug text,
  title text not null,
  app_url text,
  description text,
  usage_guide text,
  can_do text,
  cannot_do text,
  data_handled text,
  external_communication boolean default false,
  data_storage boolean default false,
  recommended_environment text,
  screenshot_url text,
  version_note text,
  caution_note text,
  is_accepted boolean default false,
  status text default 'published',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.request_comments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id) on delete cascade not null,
  solution_id uuid references public.solutions(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  body text not null,
  comment_type text default 'comment',
  created_at timestamptz default now(),
  constraint request_comments_type_check check (
    comment_type in ('question', 'answer', 'comment', 'system')
  )
);

create table if not exists public.solution_feedback (
  id uuid primary key default gen_random_uuid(),
  solution_id uuid references public.solutions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  feedback_type text not null,
  comment text,
  created_at timestamptz default now(),
  unique(solution_id, user_id, feedback_type),
  constraint solution_feedback_type_check check (
    feedback_type in ('worked', 'thanks', 'saved_time', 'clear', 'use_again', 'needs_fix', 'did_not_work')
  )
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  actor_id uuid references auth.users(id) on delete set null,
  type text not null,
  request_id uuid references public.requests(id) on delete cascade,
  solution_id uuid references public.solutions(id) on delete cascade,
  comment_id uuid,
  read_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references auth.users(id) on delete set null,
  target_type text not null,
  target_id uuid not null,
  reason text not null,
  detail text,
  status text default 'open',
  created_at timestamptz default now(),
  constraint reports_target_type_check check (
    target_type in ('request', 'solution', 'comment', 'app')
  )
);

create index if not exists requests_status_idx on public.requests(status);
create index if not exists requests_category_idx on public.requests(category);
create index if not exists requests_privacy_idx on public.requests(privacy_level);
create index if not exists requests_created_at_idx on public.requests(created_at desc);
create index if not exists solutions_request_id_idx on public.solutions(request_id);
create index if not exists solutions_user_id_idx on public.solutions(user_id);
create index if not exists request_comments_request_id_idx on public.request_comments(request_id);
create index if not exists solution_feedback_solution_id_idx on public.solution_feedback(solution_id);
create index if not exists notifications_user_id_idx on public.notifications(user_id, read_at, created_at desc);
create index if not exists reports_status_idx on public.reports(status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_requests_updated_at on public.requests;
create trigger set_requests_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

drop trigger if exists set_solutions_updated_at on public.solutions;
create trigger set_solutions_updated_at
before update on public.solutions
for each row execute function public.set_updated_at();

alter table public.requests enable row level security;
alter table public.solutions enable row level security;
alter table public.request_comments enable row level security;
alter table public.solution_feedback enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;

drop policy if exists "Public requests are readable" on public.requests;
create policy "Public requests are readable"
on public.requests for select
using (is_public = true or auth.uid() = user_id);

drop policy if exists "Authenticated users can create requests" on public.requests;
create policy "Authenticated users can create requests"
on public.requests for insert
with check (auth.uid() = user_id);

drop policy if exists "Owners can update requests" on public.requests;
create policy "Owners can update requests"
on public.requests for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Solutions on readable requests are readable" on public.solutions;
create policy "Solutions on readable requests are readable"
on public.solutions for select
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and (r.is_public = true or r.user_id = auth.uid())
  )
);

drop policy if exists "Authenticated users can create solutions" on public.solutions;
create policy "Authenticated users can create solutions"
on public.solutions for insert
with check (auth.uid() = user_id);

drop policy if exists "Solution owners can update solutions" on public.solutions;
create policy "Solution owners can update solutions"
on public.solutions for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Request owners can accept solutions" on public.solutions;
create policy "Request owners can accept solutions"
on public.solutions for update
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and r.user_id = auth.uid()
  )
);

drop policy if exists "Request comments are readable with request" on public.request_comments;
create policy "Request comments are readable with request"
on public.request_comments for select
using (
  exists (
    select 1 from public.requests r
    where r.id = request_id and (r.is_public = true or r.user_id = auth.uid())
  )
);

drop policy if exists "Authenticated users can create request comments" on public.request_comments;
create policy "Authenticated users can create request comments"
on public.request_comments for insert
with check (auth.uid() = user_id);

drop policy if exists "Feedback is readable with solution" on public.solution_feedback;
create policy "Feedback is readable with solution"
on public.solution_feedback for select
using (
  exists (
    select 1
    from public.solutions s
    join public.requests r on r.id = s.request_id
    where s.id = solution_id and (r.is_public = true or r.user_id = auth.uid())
  )
);

drop policy if exists "Authenticated users can create solution feedback" on public.solution_feedback;
create policy "Authenticated users can create solution feedback"
on public.solution_feedback for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can read own notifications" on public.notifications;
create policy "Users can read own notifications"
on public.notifications for select
using (auth.uid() = user_id);

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
on public.notifications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Authenticated users can report" on public.reports;
create policy "Authenticated users can report"
on public.reports for insert
with check (auth.uid() = reporter_id);

-- Admin report reads are intentionally handled through service-role API routes.
-- If you add direct client reads later, add a role/email based select policy.

select pg_notify('pgrst', 'reload schema');
