-- Valle 360 - Security hardening
-- Epic 9: Enable RLS on public tables flagged by Supabase advisors
-- and fix SECURITY DEFINER functions with mutable search_path.

-- =========================================================
-- RLS: Feature Flags tables (used by /admin/feature-flags)
-- =========================================================

alter table if exists public.features enable row level security;
drop policy if exists features_select_authenticated on public.features;
create policy features_select_authenticated
on public.features
for select
to authenticated
using (true);
drop policy if exists features_admin_all on public.features;
create policy features_admin_all
on public.features
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

alter table if exists public.service_features enable row level security;
drop policy if exists service_features_select_authenticated on public.service_features;
create policy service_features_select_authenticated
on public.service_features
for select
to authenticated
using (true);
drop policy if exists service_features_admin_all on public.service_features;
create policy service_features_admin_all
on public.service_features
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

alter table if exists public.client_features enable row level security;
drop policy if exists client_features_select_admin_or_client_owner on public.client_features;
create policy client_features_select_admin_or_client_owner
on public.client_features
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.clients c
    where c.id = client_features.client_id
      and c.user_id = (select auth.uid())
  )
);
drop policy if exists client_features_admin_all on public.client_features;
create policy client_features_admin_all
on public.client_features
for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

alter table if exists public.feature_requests enable row level security;
drop policy if exists feature_requests_select_admin_or_client_owner on public.feature_requests;
create policy feature_requests_select_admin_or_client_owner
on public.feature_requests
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.clients c
    where c.id = feature_requests.client_id
      and c.user_id = (select auth.uid())
  )
);
drop policy if exists feature_requests_insert_client_owner on public.feature_requests;
create policy feature_requests_insert_client_owner
on public.feature_requests
for insert
to authenticated
with check (
  requested_by_user_id = (select auth.uid())
  and exists (
    select 1
    from public.clients c
    where c.id = feature_requests.client_id
      and c.user_id = (select auth.uid())
  )
);
drop policy if exists feature_requests_admin_update on public.feature_requests;
create policy feature_requests_admin_update
on public.feature_requests
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
drop policy if exists feature_requests_admin_delete on public.feature_requests;
create policy feature_requests_admin_delete
on public.feature_requests
for delete
to authenticated
using ((select public.is_admin()));

alter table if exists public.feature_logs enable row level security;
drop policy if exists feature_logs_select_admin_or_client_owner on public.feature_logs;
create policy feature_logs_select_admin_or_client_owner
on public.feature_logs
for select
to authenticated
using (
  (select public.is_admin())
  or exists (
    select 1
    from public.clients c
    where c.id = feature_logs.client_id
      and c.user_id = (select auth.uid())
  )
);
drop policy if exists feature_logs_admin_insert on public.feature_logs;
create policy feature_logs_admin_insert
on public.feature_logs
for insert
to authenticated
with check ((select public.is_admin()));
drop policy if exists feature_logs_admin_update on public.feature_logs;
create policy feature_logs_admin_update
on public.feature_logs
for update
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));
drop policy if exists feature_logs_admin_delete on public.feature_logs;
create policy feature_logs_admin_delete
on public.feature_logs
for delete
to authenticated
using ((select public.is_admin()));

-- =========================================================
-- RLS: Admin-only tables flagged by advisors
-- (Not used by client-facing views; keep locked to admins.)
-- =========================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'people',
    'camera_locations',
    'orchestration_rules',
    'franchisees',
    'franchisee_candidates',
    'franchisee_test_templates',
    'franchisee_tests',
    'franchisee_performance',
    'franchisee_alerts',
    'person_tracking',
    'daily_kpis',
    'retail_heatmap',
    'queue_analytics',
    'table_analytics',
    'vehicle_analytics',
    'predictions',
    'anomaly_detections',
    'energy_grid_logs'
  ]
  loop
    execute format('alter table if exists public.%I enable row level security;', t);
    execute format('drop policy if exists %I on public.%I;', t || '_admin_all', t);
    execute format($sql$
      create policy %I
      on public.%I
      for all
      to authenticated
      using ((select public.is_admin()))
      with check ((select public.is_admin()));
    $sql$, t || '_admin_all', t);
  end loop;
end $$;

-- =========================================================
-- SECURITY DEFINER: fix mutable search_path warnings
-- =========================================================

-- Recreate this function with access control and explicit search_path.
create or replace function public.client_has_feature(p_client_id uuid, p_feature_code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions, pg_catalog
as $function$
declare
  v_has_feature boolean;
  v_allowed boolean;
begin
  if (select auth.role()) = 'service_role' then
    v_allowed := true;
  elsif (select public.is_admin()) then
    v_allowed := true;
  else
    v_allowed := exists (
      select 1
      from public.clients c
      where c.id = p_client_id
        and c.user_id = (select auth.uid())
    );
  end if;

  if not v_allowed then
    return false;
  end if;

  select cf.is_enabled into v_has_feature
  from public.client_features cf
  join public.features f on f.id = cf.feature_id
  where cf.client_id = p_client_id
    and f.code = p_feature_code
    and f.is_active = true
    and (cf.expires_at is null or cf.expires_at > now());

  return coalesce(v_has_feature, false);
end;
$function$;

-- Ensure search_path is fixed for other flagged functions.
alter function public._normalize_text(input text) set search_path = public, extensions, pg_catalog;
alter function public.get_next_sentiment_queue_item() set search_path = public, extensions, pg_catalog;
alter function public._nine_box_block_if_cycle_closed() set search_path = public, extensions, pg_catalog;
alter function public.update_social_post_metrics_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.cleanup_security_data() set search_path = public, extensions, pg_catalog;
alter function public.add_to_sentiment_queue(p_source_type character varying, p_source_id uuid, p_source_table character varying, p_content text, p_client_id uuid, p_user_id uuid, p_priority integer, p_metadata jsonb) set search_path = public, extensions, pg_catalog;
alter function public._nine_box_touch_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.update_instagram_posts_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.check_brute_force(p_email text, p_ip inet, p_max_attempts integer) set search_path = public, extensions, pg_catalog;
alter function public._kanban_set_client_approval() set search_path = public, extensions, pg_catalog;
alter function public.calculate_franchisee_performance_score(p_franchisee_id uuid) set search_path = public, extensions, pg_catalog;
alter function public._map_area_text_to_area_key(input text) set search_path = public, extensions, pg_catalog;
alter function public.update_social_connected_account_secrets_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.update_social_account_metrics_daily_updated_at() set search_path = public, extensions, pg_catalog;
alter function public.update_social_connected_accounts_updated_at() set search_path = public, extensions, pg_catalog;


