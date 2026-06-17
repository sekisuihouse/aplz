-- Grants required when "Automatically expose new tables" is disabled.
-- RLS policies still control which rows each role can access.

grant usage on schema public to anon, authenticated, service_role;

grant select on table
  public.profiles,
  public.communities,
  public.apps,
  public.comments,
  public.ratings,
  public.reactions,
  public.requests,
  public.solutions,
  public.request_comments,
  public.solution_feedback
to anon, authenticated;

grant select on table
  public.community_members,
  public.api_tokens,
  public.notifications
to authenticated;

grant insert, update on table public.profiles to authenticated;
grant insert, update on table public.requests to authenticated;
grant insert, update on table public.solutions to authenticated;
grant insert on table public.request_comments to authenticated;
grant insert on table public.solution_feedback to authenticated;
grant insert on table public.reports to authenticated;
grant update on table public.notifications to authenticated;

grant all privileges on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  grant all privileges on tables to service_role;

alter default privileges in schema public
  grant usage, select on sequences to service_role;

alter default privileges in schema public
  grant execute on functions to service_role;

select pg_notify('pgrst', 'reload schema');
