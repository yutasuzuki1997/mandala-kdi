"use client";

import { useEffect, useMemo, useState } from "react";
import type { Kdi, KdiCheck, FullChart } from "@/app/types";
import { getActivityLog, type ActivityEntry } from "@/lib/db";

interface Props {
  kdis: Kdi[];
  checks: KdiCheck[];
  charts: FullChart[];
  month: string;
  userId: string;
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

  // Achievement-type: binary — skip monthly rate calculation.
  if (kdi.freq === "once") {
    return kdiChecks.length > 0 ? 100 : 0;
  }
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
  userId,
  onChangeMonth,
}: Props) {
  const [view, setView] = useState<"rate" | "log">("rate");

  // KDIs that actually existed in the selected month:
  // created on/before that month, and not already ended before it.
  const monthKdis = useMemo(
    () =>
      kdis.filter((k) => {
        const startMonth = (k.start_date ?? k.created_at)?.slice(0, 7);
        if (startMonth && startMonth > month) return false;
        if (k.deadline && k.deadline.slice(0, 7) < month) return false;
        return true;
      }),
    [kdis, month]
  );

  const overallRate = useMemo(() => {
    if (monthKdis.length === 0) return 0;
    const total = monthKdis.reduce(
      (sum, k) => sum + calcRate(k, checks, month),
      0
    );
    return Math.round(total / monthKdis.length);
  }, [monthKdis, checks, month]);

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
      {/* Sub-tabs */}
      <div className="flex rounded-xl border bg-card p-1">
        {([
          { key: "rate", label: "実行率" },
          { key: "log", label: "履歴" },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition ${
              view === t.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === "log" ? (
        <ActivityLog userId={userId} />
      ) : (
        <>
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
        {monthKdis.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            この月のKDIはありません
          </p>
        )}
        <div className="space-y-2">
          {monthKdis.map((kdi) => {
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
                  <span className="text-[11px] text-muted-foreground">
                    {kdi.freq === "daily" ? "日次" : kdi.freq === "weekly" ? "週次" : kdi.freq === "monthly" ? "月次" : "達成型"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
        </>
      )}
    </div>
  );
}

const ACTIVITY_META: Record<
  ActivityEntry["kind"],
  { label: string; dot: string; tag: string }
> = {
  check: { label: "KDI実行", dot: "bg-blue-500", tag: "text-blue-700 bg-blue-100" },
  task_done: { label: "達成", dot: "bg-green-500", tag: "text-green-700 bg-green-100" },
  habit_confirmed: {
    label: "習慣化確認",
    dot: "bg-purple-500",
    tag: "text-purple-700 bg-purple-100",
  },
};

function formatDay(iso: string) {
  // iso may be a full timestamp or a date-only "YYYY-MM-DDT00:00:00"
  const [datePart, timePart] = iso.split("T");
  const [, m, d] = datePart.split("-");
  const hm =
    timePart && !timePart.startsWith("00:00:00")
      ? ` ${timePart.slice(0, 5)}`
      : "";
  return `${Number(m)}/${Number(d)}${hm}`;
}

function dayKey(iso: string) {
  return iso.split("T")[0];
}

function ActivityLog({ userId }: { userId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setEntries(null);
    setError(false);
    getActivityLog(userId)
      .then((e) => alive && setEntries(e))
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [userId]);

  // Group consecutive entries by calendar day for readable section headers.
  const groups = useMemo(() => {
    if (!entries) return [];
    const out: { day: string; items: ActivityEntry[] }[] = [];
    for (const e of entries) {
      const k = dayKey(e.at);
      const last = out[out.length - 1];
      if (last && last.day === k) last.items.push(e);
      else out.push({ day: k, items: [e] });
    }
    return out;
  }, [entries]);

  return (
    <section>
      <h3 className="mb-2 text-xs font-medium text-muted-foreground">
        アクティビティ履歴
      </h3>

      {error && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          履歴を読み込めませんでした
        </p>
      )}
      {!error && entries === null && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          読み込み中…
        </p>
      )}
      {!error && entries !== null && entries.length === 0 && (
        <p className="py-4 text-center text-xs text-muted-foreground">
          まだ履歴がありません
        </p>
      )}

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g.day}>
            <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              {g.day}
            </p>
            <div className="space-y-1.5">
              {g.items.map((e, i) => {
                const meta = ACTIVITY_META[e.kind];
                return (
                  <div
                    key={`${e.kind}-${e.at}-${i}`}
                    className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${meta.dot}`}
                    />
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-medium ${meta.tag}`}
                    >
                      {meta.label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {e.label}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatDay(e.at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
