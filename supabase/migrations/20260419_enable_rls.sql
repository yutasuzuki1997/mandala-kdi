-- Enable Row Level Security for all user-owned tables and add policies
-- scoped to auth.uid(). Apply via Supabase SQL editor (ダッシュボード) or CLI.
-- NOTE: Existing rows without user_id = auth.uid() will become invisible.

alter table if exists charts        enable row level security;
alter table if exists sub_goals     enable row level security;
alter table if exists tasks         enable row level security;
alter table if exists kdis          enable row level security;
alter table if exists kdi_checks    enable row level security;
alter table if exists user_profiles enable row level security;

-- ---------- charts ----------
drop policy if exists "users manage own charts" on charts;
create policy "users manage own charts" on charts
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- kdis ----------
drop policy if exists "users manage own kdis" on kdis;
create policy "users manage own kdis" on kdis
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------- sub_goals (scoped through charts) ----------
drop policy if exists "sub_goals via charts" on sub_goals;
create policy "sub_goals via charts" on sub_goals
  for all using (
    chart_id in (select id from charts where user_id = auth.uid())
  )
  with check (
    chart_id in (select id from charts where user_id = auth.uid())
  );

-- ---------- tasks (scoped through sub_goals → charts) ----------
drop policy if exists "tasks via sub_goals" on tasks;
create policy "tasks via sub_goals" on tasks
  for all using (
    sub_goal_id in (
      select sg.id from sub_goals sg
      join charts c on c.id = sg.chart_id
      where c.user_id = auth.uid()
    )
  )
  with check (
    sub_goal_id in (
      select sg.id from sub_goals sg
      join charts c on c.id = sg.chart_id
      where c.user_id = auth.uid()
    )
  );

-- ---------- kdi_checks (scoped through kdis) ----------
drop policy if exists "kdi_checks via kdis" on kdi_checks;
create policy "kdi_checks via kdis" on kdi_checks
  for all using (
    kdi_id in (select id from kdis where user_id = auth.uid())
  )
  with check (
    kdi_id in (select id from kdis where user_id = auth.uid())
  );

-- ---------- user_profiles ----------
drop policy if exists "users manage own profile" on user_profiles;
create policy "users manage own profile" on user_profiles
  for all using (id = auth.uid())
  with check (id = auth.uid());
