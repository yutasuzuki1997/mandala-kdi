-- Add 'monthly' (month-by-month, N times/month) to the kdis.freq allowed values.
-- Apply via Supabase SQL editor or CLI.
-- Idempotent: drops the existing check constraint (if any) and recreates it.

alter table if exists kdis
  drop constraint if exists kdis_freq_check;

alter table if exists kdis
  add constraint kdis_freq_check
  check (freq in ('daily', 'weekly', 'monthly', 'once'));
