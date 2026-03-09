-- ============================================================
-- EXPENSE TRACKER — Supabase SQL Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── expenses ────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  category    text not null,
  amount      numeric(12, 2) not null check (amount > 0),
  note        text default '',
  tags        text[] default '{}',
  created_at  timestamptz default now()
);

-- ── budgets ─────────────────────────────────────────────────
create table if not exists budgets (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  category    text not null,
  month       text not null,             -- format: "YYYY-MM"
  limit_amount numeric(12, 2) not null check (limit_amount > 0),
  created_at  timestamptz default now(),
  unique (user_id, category, month)
);

-- ── Row-Level Security ───────────────────────────────────────
alter table expenses enable row level security;
alter table budgets  enable row level security;

-- Users can only see / modify their own rows
create policy "expenses: own rows" on expenses
  for all using (auth.uid() = user_id);

create policy "budgets: own rows" on budgets
  for all using (auth.uid() = user_id);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists idx_expenses_user_date on expenses (user_id, date desc);
create index if not exists idx_budgets_user_month  on budgets  (user_id, month);

-- ── Helpful views ────────────────────────────────────────────
-- Monthly totals per category (used by ML/insights layer later)
create or replace view monthly_category_totals as
  select
    user_id,
    to_char(date, 'YYYY-MM') as month,
    category,
    sum(amount)              as total,
    count(*)                 as tx_count
  from expenses
  group by user_id, to_char(date, 'YYYY-MM'), category;
