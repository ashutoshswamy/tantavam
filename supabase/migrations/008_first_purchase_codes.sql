-- Coupon codes that only work on a customer's first paid order. Run once in Supabase SQL editor.
alter table coupons add column first_purchase_only boolean not null default false;
