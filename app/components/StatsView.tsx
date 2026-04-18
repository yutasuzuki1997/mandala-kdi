"use client";

import { useMemo } from "react";
import type { Kdi, KdiCheck, FullChart } from "@/app/types";

interface Props {
  kdis: Kdi[];
  checks: KdiCheck[];
  charts: FullChart[];
  month: string;
  onChangeMonth: (month: string) => void;
}

function getElapsedDays(month: string) {
  const now = new Date();
  const [y, m] = month.split("-").map(Number);
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  if (month === currentMonth) {
    return now.getDate();
  }
  // Past or future month: full days
  return new Date(y, m, 0).getDate();
}

function calcRate(kdi: Kdi, checks: KdiCheck[], month: string) {
  const kdiChecks = checks.filter((c) => c.kdi_id === kdi.id);

  if (kdi.freq === "daily") {
    const elapsed = getElapsedDays(month);
    return elapsed > 0 ? Math.round((kdiChecks.length / elapsed) * 100) : 0;
  }
  const target = kdi.target_per_month ?? 4;
  return target > 0 ? Math.round((kdiChecks.length / target) * 100) : 0;
}

export default function StatsView({
  kdis,
  checks,
  charts,
  month,
  onChangeMonth,
}: Props) {
  const overallRate = useMemo(() => {
    if (kdis.length === 0) return 0;
    const total = kdis.reduce((sum, k) => sum + calcRate(k, checks, month), 0);
    return Math.round(total / kdis.length);
  }, [kdis, checks, month]);

  const completedTasks = useMemo(() => {
    let count = 0;
    for (const chart of charts) {
      if (!chart.sub_goals) continue;
      for (const sg of chart.sub_goals) {
        if (!sg.tasks) continue;
        count += sg.tasks.filter((t) => t.status === "done").length;
      }
    }
    return count;
  }, [charts]);

  const totalTasks = useMemo(() => {
    let count = 0;
    for (const chart of charts) {
      if (!chart.sub_goals) continue;
      for (const sg of chart.sub_goals) {
        if (!sg.tasks) continue;
        count += sg.tasks.filter((t) => t.label).length;
      }
    }
    return count;
  }, [charts]);

  function prevMonth() {
    const [y, m] = month.split("-").map(Number);
    const pm = m === 1 ? 12 : m - 1;
    const py = m === 1 ? y - 1 : y;
    onChangeMonth(`${py}-${String(pm).padStart(2, "0")}`);
  }

  function nextMonth() {
    const [y, m] = month.split("-").map(Number);
    const nm = m === 12 ? 1 : m + 1;
    const ny = m === 12 ? y + 1 : y;
    onChangeMonth(`${ny}-${String(nm).padStart(2, "0")}`);
  }

  const [yearNum, monthNum] = month.split("-").map(Number);

  return (
    <div className="space-y-4">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-semibold">
          {yearNum}年{monthNum}月
        </span>
        <button
          onClick={nextMonth}
          className="rounded-lg p-2 hover:bg-muted"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Overall rate */}
      <div className="rounded-xl border bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">月間実行率</p>
        <p className="mt-1 text-3xl font-bold">{overallRate}%</p>
        <div className="mx-auto mt-2 h-2 w-full max-w-48 rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(overallRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Task completion */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">タスク完了</p>
          <p className="text-sm font-semibold">
            {completedTasks}/{totalTasks}
          </p>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{
              width: `${totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%`,
            }}
          />
        </div>
      </div>

      {/* KDI progress */}
      <section>
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">
          KDI別実行率
        </h3>
        {kdis.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            KDIがありません
          </p>
        )}
        <div className="space-y-2">
          {kdis.map((kdi) => {
            const rate = calcRate(kdi, checks, month);
            const isAchieved = rate >= kdi.threshold;
            return (
              <div key={kdi.id} className="rounded-xl border bg-card p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm truncate flex-1">{kdi.label}</p>
                  <span
                    className={`ml-2 text-xs font-semibold ${
                      isAchieved ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
                    }`}
                  >
                    {rate}%
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isAchieved ? "bg-green-500" : "bg-primary"
                      }`}
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {kdi.freq === "daily" ? "日次" : "週次"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
