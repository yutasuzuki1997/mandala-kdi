"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Kdi, KdiCheck, Task, FullChart } from "@/app/types";

interface Props {
  kdis: Kdi[];
  checks: KdiCheck[];
  charts: FullChart[];
  onToggleCheck: (kdiId: string, date: string) => void;
  onConfirmHabit: (taskId: string, confirmed: boolean) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate();
}

function getElapsedDays() {
  const now = new Date();
  return now.getDate();
}

function calcRate(kdi: Kdi, checks: KdiCheck[]) {
  const kdiChecks = checks.filter((c) => c.kdi_id === kdi.id);

  // Achievement-type: binary — skip monthly rate calculation.
  if (kdi.freq === "once") {
    return kdiChecks.length > 0 ? 100 : 0;
  }
  if (kdi.freq === "daily") {
    const elapsed = getElapsedDays();
    return elapsed > 0 ? Math.round((kdiChecks.length / elapsed) * 100) : 0;
  }
  // weekly
  const target = kdi.target_per_month ?? 4;
  return target > 0 ? Math.round((kdiChecks.length / target) * 100) : 0;
}

export default function TodayView({
  kdis,
  checks,
  charts,
  onToggleCheck,
  onConfirmHabit,
}: Props) {
  const [dismissedRateBanner, setDismissedRateBanner] = useState(false);
  const todayStr = today();
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Collect all tasks from all charts
  const allTasks = useMemo(() => {
    const tasks: Task[] = [];
    for (const chart of charts) {
      if (!chart.sub_goals) continue;
      for (const sg of chart.sub_goals) {
        if (!sg.tasks) continue;
        tasks.push(...sg.tasks);
      }
    }
    return tasks;
  }, [charts]);

  // ---------- Banners ----------
  const overdueTasks = useMemo(
    () =>
      allTasks.filter(
        (t) => t.deadline && t.deadline < todayStr && t.status !== "done"
      ),
    [allTasks, todayStr]
  );

  const habitConfirmTasks = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.type === "habit" &&
          t.status === "done" &&
          t.habit_confirmed_month !== currentMonthStr
      ),
    [allTasks, currentMonthStr]
  );

  const lowRateKdis = useMemo(() => {
    if (now.getDate() < 8) return [];
    // Achievement-type KDIs don't have a monthly rate — exclude from rate banner.
    return kdis.filter(
      (k) => k.freq !== "once" && calcRate(k, checks) < 50
    );
  }, [kdis, checks, now]);

  // ---------- KDI groups ----------
  const dailyKdis = kdis.filter((k) => k.freq === "daily");
  const weeklyKdis = kdis.filter((k) => k.freq === "weekly");
  const onceKdis = kdis.filter((k) => k.freq === "once");

  const isChecked = (kdiId: string) =>
    checks.some((c) => c.kdi_id === kdiId && c.checked_date === todayStr);

  // 'once' KDI: achieved if any check exists for this kdi (any date).
  const isAchieved = (kdiId: string) =>
    checks.some((c) => c.kdi_id === kdiId);

  const findAchievementDate = (kdiId: string) =>
    checks.find((c) => c.kdi_id === kdiId)?.checked_date ?? todayStr;

  return (
    <div className="space-y-4">
      {/* Overdue banner */}
      {overdueTasks.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/40">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">
            期限切れのタスクが {overdueTasks.length} 件あります
          </p>
          <ul className="mt-1 space-y-0.5">
            {overdueTasks.slice(0, 3).map((t) => (
              <li key={t.id} className="text-xs text-red-600 dark:text-red-400">
                ・{t.label}（{t.deadline}）
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Habit confirmation banner */}
      {habitConfirmTasks.length > 0 && (
        <div className="rounded-xl border border-purple-300 bg-purple-50 p-3 dark:border-purple-800 dark:bg-purple-950/40">
          <p className="text-sm font-medium text-purple-700 dark:text-purple-400">
            習慣化の確認（{habitConfirmTasks.length} 件）
          </p>
          {habitConfirmTasks.slice(0, 3).map((t) => (
            <div key={t.id} className="mt-2 flex items-center gap-2">
              <span className="flex-1 text-xs text-purple-600 dark:text-purple-400">
                {t.label}
              </span>
              <Button
                size="xs"
                variant="default"
                onClick={() => onConfirmHabit(t.id, true)}
              >
                継続中
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => onConfirmHabit(t.id, false)}
              >
                未達
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Low rate banner */}
      {lowRateKdis.length > 0 && !dismissedRateBanner && (
        <div className="rounded-xl border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950/40">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                実行率が低下しています（{lowRateKdis.length} 件）
              </p>
              <ul className="mt-1 space-y-0.5">
                {lowRateKdis.slice(0, 3).map((k) => (
                  <li
                    key={k.id}
                    className="text-xs text-yellow-600 dark:text-yellow-400"
                  >
                    ・{k.label}（{calcRate(k, checks)}%）
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setDismissedRateBanner(true)}
              className="ml-2 text-yellow-500 hover:text-yellow-700"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Daily KDIs */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          デイリー
        </h2>
        {dailyKdis.length === 0 && (
          <p className="text-xs text-muted-foreground">デイリーKDIがありません</p>
        )}
        <div className="space-y-2">
          {dailyKdis.map((kdi) => {
            const checked = isChecked(kdi.id);
            const rate = calcRate(kdi, checks);
            return (
              <div
                key={kdi.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <button
                  onClick={() => onToggleCheck(kdi.id, todayStr)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    checked
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {checked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${checked ? "line-through text-muted-foreground" : ""}`}>
                    {kdi.label}
                  </p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-green-500 transition-all"
                      style={{ width: `${Math.min(rate, 100)}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {rate}%
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Achievement-type KDIs */}
      {onceKdis.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            達成型
          </h2>
          <div className="space-y-2">
            {onceKdis.map((kdi) => {
              const achieved = isAchieved(kdi.id);
              return (
                <div
                  key={kdi.id}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm truncate ${
                        achieved ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {kdi.label}
                    </p>
                    {kdi.deadline && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        〜{kdi.deadline}
                      </p>
                    )}
                  </div>
                  {achieved ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                        達成済み
                      </span>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          onToggleCheck(kdi.id, findAchievementDate(kdi.id))
                        }
                      >
                        取消
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="xs"
                      variant="default"
                      className="shrink-0"
                      onClick={() => onToggleCheck(kdi.id, todayStr)}
                    >
                      達成する
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Weekly KDIs */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          ウィークリー
        </h2>
        {weeklyKdis.length === 0 && (
          <p className="text-xs text-muted-foreground">ウィークリーKDIがありません</p>
        )}
        <div className="space-y-2">
          {weeklyKdis.map((kdi) => {
            const checked = isChecked(kdi.id);
            const rate = calcRate(kdi, checks);
            return (
              <div
                key={kdi.id}
                className="flex items-center gap-3 rounded-xl border bg-card p-3"
              >
                <button
                  onClick={() => onToggleCheck(kdi.id, todayStr)}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition ${
                    checked
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {checked && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${checked ? "line-through text-muted-foreground" : ""}`}>
                    {kdi.label}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <div className="h-1.5 flex-1 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all"
                        style={{ width: `${Math.min(rate, 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {kdi.target_per_month ?? 4}回/月
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {rate}%
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
