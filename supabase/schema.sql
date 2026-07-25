-- Dinner Decider schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run)

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid not null references categories(id) on delete restrict,
  prep_time integer,
  cook_time integer,
  protein_g numeric,
  carbs_g numeric,
  fats_g numeric,
  ingredients jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

insert into categories (name) values ('Unassigned')
on conflict (name) do nothing;

-- No auth in this app: allow the shared anon key full read/write access.
alter table categories enable row level security;
alter table meals enable row level security;

create policy "Public full access" on categories for all using (true) with check (true);
create policy "Public full access" on meals for all using (true) with check (true);
