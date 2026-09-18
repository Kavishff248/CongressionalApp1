-- CongressionalApp production Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.members (
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

create table if not exists public.bills (
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

create table if not exists public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null check (item_type in ('member','bill')),
  item_id text not null,
  created_at timestamptz not null default now(),
  unique(user_id,item_type,item_id)
);

alter table public.members enable row level security;
alter table public.bills enable row level security;
alter table public.saved_items enable row level security;

drop policy if exists "members are readable" on public.members;
create policy "members are readable" on public.members for select using (true);
drop policy if exists "bills are readable" on public.bills;
create policy "bills are readable" on public.bills for select using (true);
drop policy if exists "users read own saved items" on public.saved_items;
create policy "users read own saved items" on public.saved_items for select using (auth.uid() = user_id);
drop policy if exists "users create own saved items" on public.saved_items;
create policy "users create own saved items" on public.saved_items for insert with check (auth.uid() = user_id);
drop policy if exists "users delete own saved items" on public.saved_items;
create policy "users delete own saved items" on public.saved_items for delete using (auth.uid() = user_id);

create index if not exists members_state_idx on public.members(state);
create index if not exists members_chamber_idx on public.members(chamber);
create index if not exists bills_status_idx on public.bills(status);
create index if not exists bills_topic_idx on public.bills(topic);

-- No fictional congressional records are seeded.
-- Live records must come from an authoritative source such as Congress.gov.
