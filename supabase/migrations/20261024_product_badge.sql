-- Run once in the Supabase SQL editor on an existing database. Safe to re-run.
-- Fresh databases don't need this: schema.sql already includes it.

-- Optional label shown on a product ("Best seller", "Fast selling", ...). Empty = no label.
alter table products add column if not exists badge text;

-- Wash care instructions shown on the product page. Empty = section hidden.
alter table products add column if not exists care text;

-- Key highlights overlaid on a product photo, one "Label: value" per line (Craft: Rogan). Empty = no overlay.
alter table products add column if not exists highlights text;

-- Coupons the admin chose to advertise under the product (private codes stay private).
alter table coupons add column if not exists public boolean not null default false;
