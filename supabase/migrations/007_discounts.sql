-- Coupon codes + automatic first-purchase discount. Run once in Supabase SQL editor.
create table coupons (
  code text primary key check (code = upper(code) and code <> ''),
  kind text not null check (kind in ('percent', 'flat')),
  value int not null check (value > 0),          -- percent (1-100) or paise
  min_order int not null default 0,              -- paise
  max_uses int check (max_uses > 0),             -- total paid uses; null = unlimited
  expires_at timestamptz,
  active boolean not null default true,
  first_order boolean not null default false,    -- the automatic first-purchase discount; can't be typed in as a code
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);
create unique index coupons_one_first_order on coupons (first_order) where first_order;
insert into coupons (code, kind, value, active, first_order) values ('FIRST-ORDER', 'percent', 10, false, true);
alter table coupons enable row level security;

alter table orders add column subtotal int, add column discount int not null default 0, add column coupon_code text;
update orders set subtotal = amount where subtotal is null;
alter table orders alter column subtotal set not null;
create index on orders (coupon_code) where coupon_code is not null;
