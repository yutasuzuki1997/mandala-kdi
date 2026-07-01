-- Soft-delete for KDIs: archiving a KDI hides it from active views (today / KDI /
-- chart) while preserving its kdi_checks history for stats & the activity log.
-- Apply via Supabase SQL editor or CLI. Idempotent.

alter table if exists kdis
  add column if not exists archived_at timestamptz;

-- Optional: index to keep the "active KDIs" filter fast.
create index if not exists kdis_active_idx
  on kdis (user_id)
  where archived_at is null;
