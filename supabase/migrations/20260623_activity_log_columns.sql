-- Activity log support: record WHEN a task was completed / a habit confirmed,
-- and WHEN a KDI check was toggled on.
-- Apply via Supabase SQL editor or CLI. Idempotent.

alter table if exists tasks
  add column if not exists completed_at timestamptz;

alter table if exists tasks
  add column if not exists habit_confirmed_at timestamptz;

alter table if exists kdi_checks
  add column if not exists created_at timestamptz default now();
