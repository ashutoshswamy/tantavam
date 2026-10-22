-- Run once in the Supabase SQL editor on an existing database. Safe to re-run.
-- Fresh databases don't need this: schema.sql already includes both changes.

-- 1. Hide products from the storefront (admin product form checkbox)
alter table products add column if not exists hidden boolean not null default false;

-- 2. Admin invoices (/admin/invoices)
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  seq bigint generated always as identity,       -- shown as TNT-0001
  invoice_date date not null default current_date,
  customer jsonb not null default '{}',          -- {name, phone, address}
  items jsonb not null default '[]',             -- [{productId, name, size, qty, unit}] unit in paise
  adjustments jsonb not null default '[]',       -- [{label, type: discount|charge, mode: flat|percent, value}] flat in paise
  notes text not null default '',
  subtotal int not null,                         -- paise
  total int not null,                            -- paise
  created_at timestamptz not null default now()
);
alter table invoices enable row level security;
revoke all on invoices from anon, authenticated;
