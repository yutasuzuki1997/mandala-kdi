import { supabase } from "./supabase";

// ---------- Charts ----------

export async function getCharts(userId: string) {
  const { data, error } = await supabase
    .from("charts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createChart(
  userId: string,
  name: string,
  theme: string
) {
  const { data, error } = await supabase
    .from("charts")
    .insert({ user_id: userId, name, theme })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateChart(
  id: string,
  data: Record<string, unknown>
) {
  const { data: updated, error } = await supabase
    .from("charts")
    .update(data)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return updated;
}

export async function deleteChart(id: string) {
  const { error } = await supabase.from("charts").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Full Chart (nested) ----------

export async function getFullChart(chartId: string) {
  const { data, error } = await supabase
    .from("charts")
    .select(
      `
      *,
      sub_goals (
        *,
        tasks (*)
      )
    `
    )
    .eq("id", chartId)
    .single();
  if (error) throw error;
  return data;
}

// ---------- Chart Init (sub_goals + tasks bulk insert) ----------

export async function initChartData(chartId: string) {
  // Create 8 sub_goals
  const subGoals = Array.from({ length: 8 }, (_, i) => ({
    chart_id: chartId,
    position: i,
    label: `サブ目標${i + 1}`,
  }));
  const { data: sgs, error: sgErr } = await supabase
    .from("sub_goals")
    .insert(subGoals)
    .select();
  if (sgErr) throw sgErr;

  // Create 8 tasks per sub_goal = 64 tasks
  const tasks = sgs.flatMap((sg: { id: string }) =>
    Array.from({ length: 8 }, (_, i) => ({
      sub_goal_id: sg.id,
      position: i,
      label: "",
      type: "achieve",
      status: "active",
    }))
  );
  const { error: tErr } = await supabase.from("tasks").insert(tasks);
  if (tErr) throw tErr;
}

// ---------- Chart Theme ----------

export async function updateChartTheme(chartId: string, theme: string) {
  const { data, error } = await supabase
    .from("charts")
    .update({ theme })
    .eq("id", chartId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- Sub Goals ----------

export async function updateSubGoal(id: string, label: string) {
  const { data, error } = await supabase
    .from("sub_goals")
    .update({ label })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ---------- Tasks ----------

export async function upsertTask(
  data: Record<string, unknown>
) {
  const { data: row, error } = await supabase
    .from("tasks")
    .upsert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

// ---------- KDIs ----------

export async function getKdis(userId: string) {
  const { data, error } = await supabase
    .from("kdis")
    .select("*, task:tasks(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function upsertKdi(data: Record<string, unknown>) {
  const { data: row, error } = await supabase
    .from("kdis")
    .upsert(data)
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function deleteKdi(id: string) {
  const { error } = await supabase.from("kdis").delete().eq("id", id);
  if (error) throw error;
}

// ---------- KDI Checks ----------

export async function toggleCheck(kdiId: string, date: string) {
  // Check if a record already exists
  const { data: existing } = await supabase
    .from("kdi_checks")
    .select("id")
    .eq("kdi_id", kdiId)
    .eq("checked_date", date)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("kdi_checks")
      .delete()
      .eq("id", existing.id);
    if (error) throw error;
    return null;
  }

  const { data, error } = await supabase
    .from("kdi_checks")
    .insert({ kdi_id: kdiId, checked_date: date })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getChecks(userId: string, month: string) {
  // month format: "YYYY-MM"
  const startDate = `${month}-01`;
  const [year, m] = month.split("-").map(Number);
  const endDate = `${year}-${String(m + 1).padStart(2, "0")}-01`;

  const { data, error } = await supabase
    .from("kdi_checks")
    .select("*, kdi:kdis!inner(user_id)")
    .eq("kdi.user_id", userId)
    .gte("checked_date", startDate)
    .lt("checked_date", endDate);
  if (error) throw error;
  return data;
}
