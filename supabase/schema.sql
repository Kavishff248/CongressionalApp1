-- CongressionalApp Supabase schema
-- Run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.members (
  id text primary key,
  name text not null,
  party text not null,
  state text not null,
  district text,
  chamber text not null,
  role text,
  committees text,
  updated date default current_date
);

create table if not exists public.bills (
  id text primary key,
  title text not null,
  chamber text,
  status text,
  sponsor text,
  topic text,
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

-- Seed data is intentionally small and clearly suitable for demo/testing.
insert into public.members(id,name,party,state,district,chamber,role,committees,updated) values
('D001','Alexandra Morgan','D','SC','07','House','Representative','Energy & Commerce; Education','2026-09-16'),
('R001','Daniel Carter','R','SC','01','House','Representative','Armed Services; Budget','2026-09-16'),
('I001','Jordan Lee','I','SC','00','Senate','Senator','Judiciary; Finance','2026-09-16')
on conflict (id) do nothing;

insert into public.bills(id,title,chamber,status,sponsor,topic,updated,summary) values
('HR-1024','Digital Access and Connectivity Act','House','Introduced','Alexandra Morgan','Technology','2026-09-15','Would expand access to broadband infrastructure and digital skills programs.'),
('S-418','Clean Energy Research Act','Senate','Committee','Jordan Lee','Energy','2026-09-14','Would authorize federal support for clean-energy research and demonstration programs.')
on conflict (id) do nothing;
