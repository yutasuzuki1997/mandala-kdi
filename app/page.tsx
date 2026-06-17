"use client";

import { useCallback, useState } from "react";
import { useAppData } from "./hooks/useAppData";
import TodayView from "./components/TodayView";
import TimelineView from "./components/TimelineView";
import ChartView from "./components/ChartView";
import KdiView from "./components/KdiView";
import StatsView from "./components/StatsView";
import * as db from "@/lib/db";
import type { FullChart } from "./types";

type Tab = "today" | "timeline" | "chart" | "kdi" | "stats";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "today", label: "今日", icon: "M12 2v10l4.24 4.24" },
  { key: "timeline", label: "年間", icon: "M4 4v16h16" },
  { key: "chart", label: "チャート", icon: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" },
  { key: "kdi", label: "KDI", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  { key: "stats", label: "実績", icon: "M18 20V10M12 20V4M6 20v-6" },
];

function Skeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("today");
  const data = useAppData();

  // FullChart cache for all charts (for TodayView/TimelineView/StatsView)
  const [fullCharts, setFullCharts] = useState<FullChart[]>([]);
  const [fullChartsLoaded, setFullChartsLoaded] = useState(false);

  // Load all full charts once data is ready
  const loadAllFullCharts = useCallback(async () => {
    if (fullChartsLoaded || data.charts.length === 0) return;
    const results = await Promise.all(
      data.charts.map((c) => db.getFullChart(c.id))
    );
    setFullCharts(results);
    setFullChartsLoaded(true);
  }, [data.charts, fullChartsLoaded]);

  // Trigger load when not loading and charts exist
  if (!data.loading && data.charts.length > 0 && !fullChartsLoaded) {
    loadAllFullCharts();
  }

  // ---------- Handlers ----------
  const handleToggleCheck = useCallback(
    (kdiId: string, date: string) => {
      data.toggleCheck(kdiId, date);
    },
    [data.toggleCheck]
  );

  const handleConfirmHabit = useCallback(
    async (taskId: string, confirmed: boolean) => {
      if (confirmed) {
        const now = new Date();
        const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        await data.upsertTask({
          id: taskId,
          habit_confirmed_month: month,
        });
      } else {
        await data.upsertTask({ id: taskId, status: "active" });
      }
      setFullChartsLoaded(false);
    },
    [data.upsertTask]
  );

  const handleCompleteTask = useCallback(
    async (taskId: string) => {
      await data.upsertTask({ id: taskId, status: "done" });
      setFullChartsLoaded(false);
    },
    [data.upsertTask]
  );

  const handleRescheduleTask = useCallback(
    async (taskId: string, deadline: string) => {
      await data.upsertTask({ id: taskId, deadline });
      setFullChartsLoaded(false);
    },
    [data.upsertTask]
  );

  const handleRescheduleKdi = useCallback(
    async (kdiId: string, deadline: string) => {
      await db.upsertKdi({ id: kdiId, deadline });
      await data.refreshKdis();
    },
    [data.refreshKdis]
  );

  const handleSelectChart = useCallback(
    (chartId: string) => {
      data.loadFullChart(chartId);
    },
    [data.loadFullChart]
  );

  const handleCreateChart = useCallback(
    async (name: string, theme: string) => {
      const c = await data.createChart(name, theme);
      data.loadFullChart(c.id);
      setFullChartsLoaded(false);
    },
    [data.createChart, data.loadFullChart]
  );

  const handleUpdateTheme = useCallback(
    async (chartId: string, theme: string) => {
      await data.updateTheme(chartId, theme);
      setFullChartsLoaded(false);
    },
    [data.updateTheme]
  );

  const handleDeleteChart = useCallback(
    async (id: string) => {
      await data.deleteChart(id);
      setFullChartsLoaded(false);
    },
    [data.deleteChart]
  );

  const handleUpdateSubGoal = useCallback(
    async (id: string, label: string) => {
      await data.updateSubGoal(id, label);
      setFullChartsLoaded(false);
    },
    [data.updateSubGoal]
  );

  const handleUpsertTask = useCallback(
    async (taskData: Record<string, unknown>) => {
      await data.upsertTask(taskData);
      setFullChartsLoaded(false);
    },
    [data.upsertTask]
  );

  const handleUpsertKdi = useCallback(
    async (kdiData: Record<string, unknown>) => {
      await data.upsertKdi(kdiData);
    },
    [data.upsertKdi]
  );

  const handleDeleteKdi = useCallback(
    async (id: string) => {
      await data.deleteKdi(id);
    },
    [data.deleteKdi]
  );

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-[640px] flex-col"
      style={{ background: "#f1f7f1", color: "#2c3a2e" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-2.5 px-4 py-3"
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #d3e3d2",
          boxShadow: "0 1px 3px rgba(46,158,79,0.08)",
        }}
      >
        <span
          aria-hidden
          className="flex h-8 w-8 items-center justify-center rounded-xl"
          style={{ background: "linear-gradient(135deg,#3aaf5b,#2e9e4f)", boxShadow: "0 2px 6px rgba(46,158,79,0.3)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z" />
          </svg>
        </span>
        <h1
          className="text-base"
          style={{ fontFamily: "'Zen Maru Gothic', sans-serif", fontWeight: 700, color: "#1f6d39" }}
        >
          Mandala KDI
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {data.loading ? (
          <Skeleton />
        ) : (
          <>
            {tab === "today" && (
              <TodayView
                kdis={data.kdis}
                checks={data.checks}
                charts={fullCharts}
                onToggleCheck={handleToggleCheck}
                onConfirmHabit={handleConfirmHabit}
              />
            )}
            {tab === "timeline" && (
              <TimelineView
                charts={fullCharts}
                kdis={data.kdis}
                onCompleteTask={handleCompleteTask}
                onRescheduleTask={handleRescheduleTask}
                onRescheduleKdi={handleRescheduleKdi}
              />
            )}
            {tab === "chart" && (
              <ChartView
                charts={data.charts}
                fullChart={data.fullChart}
                kdis={data.kdis}
                checks={data.checks}
                onSelectChart={handleSelectChart}
                onCreateChart={handleCreateChart}
                onDeleteChart={handleDeleteChart}
                onUpdateTheme={handleUpdateTheme}
                onUpdateSubGoal={handleUpdateSubGoal}
                onUpsertTask={handleUpsertTask}
                onUpsertKdi={handleUpsertKdi}
                onDeleteKdi={handleDeleteKdi}
                onRefreshKdis={data.refreshKdis}
              />
            )}
            {tab === "kdi" && (
              <KdiView
                kdis={data.kdis}
                charts={data.charts}
                onUpsertKdi={handleUpsertKdi}
                onDeleteKdi={handleDeleteKdi}
                onRescheduleKdi={handleRescheduleKdi}
              />
            )}
            {tab === "stats" && (
              <StatsView
                kdis={data.kdis}
                checks={data.checks}
                charts={fullCharts}
                month={data.month}
                onChangeMonth={data.setMonth}
              />
            )}
          </>
        )}
      </main>

      {/* Tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-20"
        style={{
          background: "linear-gradient(180deg,#34a857,#2e9e4f)",
          boxShadow: "0 -2px 10px rgba(46,158,79,0.25)",
        }}
      >
        <div className="mx-auto flex max-w-[640px] px-1.5 py-1.5">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] transition"
                style={{
                  fontFamily: "'Zen Maru Gothic', sans-serif",
                  color: "#ffffff",
                  fontWeight: active ? 700 : 500,
                  background: active ? "rgba(255,255,255,0.22)" : "transparent",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2 : 1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ opacity: active ? 1 : 0.8 }}
                >
                  <path d={t.icon} />
                </svg>
                <span style={{ opacity: active ? 1 : 0.85 }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
