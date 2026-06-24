-- KDI start date: lets the app hide a KDI before it has started.
-- Apply via Supabase SQL editor or CLI. Idempotent.

alter table if exists kdis
  add column if not exists start_date date;

-- Backfill: existing monthly-split KDIs start at the first of their deadline month.
update kdis
  set start_date = date_trunc('month', deadline)::date
  where freq = 'monthly'
    and start_date is null
    and deadline is not null;
