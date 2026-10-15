-- Reconstructed baseline from the current CivicSignal Supabase schema.
-- The original migration files were absent from version control. This baseline
-- creates the current schema for clean preview databases while preserving the
-- remote migration version sequence in the following marker migrations.

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 5 and 120),
  category text not null,
  county text not null check (char_length(county) between 2 and 80),
  address text not null check (char_length(address) between 5 and 240),
  description text not null check (char_length(description) between 10 and 2000),
  reporter_name text,
  is_anonymous boolean not null default false,
  latitude double precision,
  longitude double precision,
  status text not null default 'pending' check (status in ('pending','verified','rejected')),
  report_count integer not null default 1 check (report_count >= 1),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.report_photos (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  path text not null,
  url text not null,
  name text,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  display_name text,
  is_anonymous boolean not null default false,
  comment_text text not null check (char_length(comment_text) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table public.community_priorities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  county text not null,
  address text not null,
  report_count integer not null default 1,
  first_report_id uuid references public.reports(id) on delete set null,
  last_report_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (title, address)
);

create table public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.reports(id) on delete cascade,
  notification_type text not null default 'county_threshold',
  county text not null,
  subject text not null,
  body text not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.congress_members (
  id text primary key,
  name text not null,
  party text,
  state text not null,
  district text,
  chamber text not null,
  role text,
  committees text,
  official_url text,
  updated date default current_date
);

create table public.congress_bills (
  id text primary key,
  title text not null,
  chamber text,
  status text,
  sponsor text,
  topic text,
  official_url text,
  updated date default current_date,
  summary text
);

create table public.congress_saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('member','bill')),
  item_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_type, item_id)
);

create table public.report_events (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  event_type text not null check (event_type in ('identified','verified','agency_notified','meeting','funding','work_started','resolved')),
  title text not null check (char_length(title) between 3 and 160),
  details text check (details is null or char_length(details) <= 1000),
  event_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.policy_trackers (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports(id) on delete cascade,
  agency text,
  funding_sources text,
  meeting_url text,
  meeting_note text,
  public_action text,
  current_status text not null default 'Verified',
  updated_at timestamptz not null default now()
);

create table public.tetris_scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 24),
  score bigint not null default 0 check (score >= 0),
  lines integer not null default 0 check (lines >= 0),
  level integer not null default 1 check (level >= 1),
  mode text not null check (mode in ('solo','competitive')),
  created_at timestamptz not null default now()
);

create index reports_status_created_idx on public.reports (status, created_at desc);
create index reports_county_idx on public.reports (county);
create index reports_address_idx on public.reports (address);
create index report_photos_report_idx on public.report_photos (report_id);
create index comments_report_idx on public.comments (report_id, created_at);
create index community_priorities_first_report_id_idx on public.community_priorities (first_report_id);
create index notification_queue_report_id_idx on public.notification_queue (report_id);
create index congress_members_state_idx on public.congress_members (state);
create index congress_members_chamber_idx on public.congress_members (chamber);
create index congress_bills_status_idx on public.congress_bills (status);
create index congress_bills_topic_idx on public.congress_bills (topic);
create index report_events_report_id_date_idx on public.report_events (report_id, event_date);
create index policy_trackers_report_id_idx on public.policy_trackers (report_id);
create index tetris_scores_score_idx on public.tetris_scores (mode, score desc, created_at);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create or replace function public.force_pending_report()
returns trigger language plpgsql set search_path = public
as $$ begin new.status = 'pending'; new.verified_at = null; new.report_count = 1; return new; end; $$;

create or replace function public.process_repeated_report()
returns trigger language plpgsql security definer set search_path = public, pg_temp
as $$
declare anchor public.reports; new_count integer;
begin
  select * into anchor from public.reports
  where id <> new.id and lower(trim(title)) = lower(trim(new.title))
    and lower(trim(address)) = lower(trim(new.address))
    and lower(trim(county)) = lower(trim(new.county))
    and status <> 'rejected'
  order by created_at asc limit 1;
  if anchor.id is not null then
    update public.reports set report_count = coalesce(report_count,1) + 1, updated_at = now()
      where id = anchor.id returning report_count into new_count;
    update public.reports set report_count = new_count, updated_at = now() where id = new.id;
    insert into public.community_priorities(title, category, county, address, report_count, first_report_id, last_report_at)
      values(anchor.title, anchor.category, anchor.county, anchor.address, new_count, anchor.id, now())
      on conflict (title, address) do update set report_count = excluded.report_count, last_report_at = now();
    if new_count > 3 then
      insert into public.notification_queue(report_id, county, subject, body)
      values(anchor.id, anchor.county, 'CivicSignal: repeated community report',
        format('The issue "%s" at %s has received %s matching reports in %s County.',
          anchor.title, anchor.address, new_count, anchor.county));
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.seed_policy_tracker()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
declare agency_text text; funding_text text;
begin
  if new.status = 'verified' and (old.status is distinct from 'verified') then
    agency_text := case new.category
      when 'roads' then 'South Carolina Department of Transportation or the local road owner'
      when 'flooding' then 'Local emergency management, public works, or the agency with flood jurisdiction'
      when 'transit' then 'Local transit provider or transportation authority'
      when 'schools' then 'School district or the responsible public education agency'
      when 'environment' then 'South Carolina Department of Environmental Services or local government'
      when 'development' then 'City or county planning, zoning, or development office'
      when 'facilities' then 'City, county, school district, or facility owner'
      when 'safety' then 'Local public-safety agency with jurisdiction'
      else 'Local government or agency with jurisdiction'
    end;
    funding_text := case new.category
      when 'roads' then 'Potential sources can include state transportation funds and eligible federal transportation grants. Eligibility must be checked for the specific project.'
      when 'flooding' then 'Potential sources can include FEMA mitigation programs and eligible U.S. Army Corps of Engineers authorities. Eligibility depends on project scope and applicant.'
      when 'transit' then 'Potential sources can include Federal Transit Administration programs and state/local transportation funds.'
      when 'schools' then 'Potential sources can include district, state, and eligible federal education programs.'
      when 'environment' then 'Potential sources can include state environmental programs and eligible federal environmental grants.'
      else 'Funding depends on the project, agency, and eligibility rules. Check the official agency or Grants.gov sources before treating funding as available.'
    end;
    insert into public.policy_trackers(report_id, agency, funding_sources, meeting_note, public_action, current_status)
      values(new.id, agency_text, funding_text,
        'Check the responsible agency or county public meeting calendar for hearings, agendas, and public comment opportunities.',
        'Document the issue, verify the responsible agency, and use the official public contact or meeting process.', 'Verified')
      on conflict (report_id) do nothing;
    insert into public.report_events(report_id,event_type,title,details,event_date)
      values(new.id,'identified','Community issue reported','A community member submitted this issue to CivicSignal.',new.created_at)
      on conflict do nothing;
    insert into public.report_events(report_id,event_type,title,details,event_date)
      values(new.id,'verified','Report verified','A CivicSignal reviewer verified the report for public display.',coalesce(new.verified_at,now()))
      on conflict do nothing;
  end if;
  return new;
end;
$$;

alter table public.admin_users enable row level security;
alter table public.reports enable row level security;
alter table public.report_photos enable row level security;
alter table public.comments enable row level security;
alter table public.community_priorities enable row level security;
alter table public.notification_queue enable row level security;
alter table public.congress_members enable row level security;
alter table public.congress_bills enable row level security;
alter table public.congress_saved_items enable row level security;
alter table public.report_events enable row level security;
alter table public.policy_trackers enable row level security;
alter table public.tetris_scores enable row level security;

create policy "admins read own record" on public.admin_users for select to authenticated using ((select auth.uid()) = user_id);
create policy "public can submit reports" on public.reports for insert to anon, authenticated with check (status = 'pending');
create policy "public can read verified reports" on public.reports for select to anon, authenticated using (status = 'verified');
create policy "admins read all reports" on public.reports for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admins update reports" on public.reports for update to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "public read verified report photos" on public.report_photos for select to anon, authenticated using (exists (select 1 from public.reports r where r.id = report_photos.report_id and r.status = 'verified'));
create policy "admins read all report photos" on public.report_photos for select to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "public can add photo metadata" on public.report_photos for insert to anon, authenticated with check (exists (select 1 from public.reports r where r.id = report_photos.report_id and r.status = 'pending'));
create policy "public read comments" on public.comments for select to anon, authenticated using (exists (select 1 from public.reports r where r.id = comments.report_id and r.status = 'verified'));
create policy "public can add comments" on public.comments for insert to anon, authenticated with check (exists (select 1 from public.reports r where r.id = comments.report_id and r.status = 'verified'));
create policy "admins manage comments" on public.comments for all to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "public read priorities" on public.community_priorities for select to anon, authenticated using (true);
create policy "admins manage priorities" on public.community_priorities for all to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "admins manage notification queue" on public.notification_queue for all to authenticated using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))) with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid())));
create policy "congress members readable" on public.congress_members for select to public using (true);
create policy "congress bills readable" on public.congress_bills for select to public using (true);
create policy "congress saved read own" on public.congress_saved_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "congress saved insert own" on public.congress_saved_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "congress saved delete own" on public.congress_saved_items for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Public can read report events" on public.report_events for select to anon, authenticated using (exists (select 1 from public.reports r where r.id = report_events.report_id and r.status = 'verified'));
create policy "Public can read verified policy trackers" on public.policy_trackers for select to anon, authenticated using (exists (select 1 from public.reports r where r.id = policy_trackers.report_id and r.status = 'verified'));
create policy "tetris scores readable" on public.tetris_scores for select to anon, authenticated using (true);
create policy "tetris scores insertable" on public.tetris_scores for insert to anon, authenticated with check (char_length(player_name) between 1 and 24 and score >= 0);

create trigger reports_set_updated_at before update on public.reports for each row execute function public.set_updated_at();
create trigger reports_force_pending before insert on public.reports for each row execute function public.force_pending_report();
create trigger reports_process_repeated after insert on public.reports for each row execute function public.process_repeated_report();
create trigger reports_seed_policy_tracker after update of status on public.reports for each row execute function public.seed_policy_tracker();

-- Explicit grants are tightened again in the final migration. These grants are
-- required so the restored baseline works consistently on a clean preview DB.
grant select on public.admin_users to authenticated;
grant select, insert on public.reports to anon, authenticated;
grant update on public.reports to authenticated;
grant select, insert on public.comments to anon, authenticated;
grant update, delete on public.comments to authenticated;
grant select, insert on public.report_photos to anon, authenticated;
grant select on public.community_priorities, public.congress_members, public.congress_bills, public.report_events, public.policy_trackers to anon, authenticated;
grant insert, update, delete on public.community_priorities to authenticated;
grant select, insert, update, delete on public.notification_queue to authenticated;
grant select, insert, delete on public.congress_saved_items to authenticated;
grant select, insert on public.tetris_scores to anon, authenticated;
