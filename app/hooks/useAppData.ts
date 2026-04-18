"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getUserId } from "@/lib/user";
import * as db from "@/lib/db";
import type { Chart, FullChart, Kdi, KdiCheck } from "@/app/types";

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function useAppData() {
  const userIdRef = useRef<string>("");
  const [loading, setLoading] = useState(true);
  const [charts, setCharts] = useState<Chart[]>([]);
  const [fullChart, setFullChart] = useState<FullChart | null>(null);
  const [kdis, setKdis] = useState<Kdi[]>([]);
  const [checks, setChecks] = useState<KdiCheck[]>([]);
  const [month, setMonth] = useState(currentMonth);

  // ---------- Init ----------
  useEffect(() => {
    (async () => {
      try {
        const uid = await getUserId();
        userIdRef.current = uid;
        const [c, k, ch] = await Promise.all([
          db.getCharts(uid),
          db.getKdis(uid),
          db.getChecks(uid, currentMonth()),
        ]);
        setCharts(c ?? []);
        setKdis(k ?? []);
        setChecks(ch ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- Reload checks when month changes ----------
  useEffect(() => {
    if (!userIdRef.current) return;
    db.getChecks(userIdRef.current, month).then((ch) =>
      setChecks(ch ?? [])
    );
  }, [month]);

  // ---------- Chart ----------
  const loadFullChart = useCallback(async (chartId: string) => {
    const fc = await db.getFullChart(chartId);
    setFullChart(fc);
  }, []);

  const createChart = useCallback(
    async (name: string, theme: string) => {
      const c = await db.createChart(userIdRef.current, name, theme);
      await db.initChartData(c.id);
      setCharts((prev) => [c, ...prev]);
      return c;
    },
    []
  );

  const updateSubGoal = useCallback(
    async (id: string, label: string) => {
      await db.updateSubGoal(id, label);
      if (fullChart) {
        await loadFullChart(fullChart.id);
      }
    },
    [fullChart, loadFullChart]
  );

  const updateTheme = useCallback(
    async (chartId: string, theme: string) => {
      await db.updateChartTheme(chartId, theme);
      setCharts((prev) =>
        prev.map((c) => (c.id === chartId ? { ...c, theme } : c))
      );
      if (fullChart && fullChart.id === chartId) {
        await loadFullChart(chartId);
      }
    },
    [fullChart, loadFullChart]
  );

  const deleteChart = useCallback(async (id: string) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
    await db.deleteChart(id);
  }, []);

  // ---------- Task ----------
  const upsertTask = useCallback(
    async (data: Record<string, unknown>) => {
      const row = await db.upsertTask(data);
      // Refresh full chart if loaded
      if (fullChart) {
        await loadFullChart(fullChart.id);
      }
      return row;
    },
    [fullChart, loadFullChart]
  );

  // ---------- KDI ----------
  const refreshKdis = useCallback(async () => {
    const k = await db.getKdis(userIdRef.current);
    setKdis(k ?? []);
  }, []);

  const upsertKdi = useCallback(
    async (data: Record<string, unknown>) => {
      const row = await db.upsertKdi({
        ...data,
        user_id: userIdRef.current,
      });
      await refreshKdis();
      return row;
    },
    [refreshKdis]
  );

  const deleteKdi = useCallback(
    async (id: string) => {
      setKdis((prev) => prev.filter((k) => k.id !== id));
      await db.deleteKdi(id);
    },
    []
  );

  // ---------- Check ----------
  const toggleCheck = useCallback(
    async (kdiId: string, date: string) => {
      const existing = checks.find(
        (c) => c.kdi_id === kdiId && c.checked_date === date
      );
      if (existing) {
        setChecks((prev) => prev.filter((c) => c.id !== existing.id));
      } else {
        const temp: KdiCheck = {
          id: `temp-${Date.now()}`,
          kdi_id: kdiId,
          checked_date: date,
        };
        setChecks((prev) => [...prev, temp]);
      }
      const result = await db.toggleCheck(kdiId, date);
      // Refresh to get real IDs
      const fresh = await db.getChecks(userIdRef.current, month);
      setChecks(fresh ?? []);
      return result;
    },
    [checks, month]
  );

  return {
    loading,
    userId: userIdRef.current,
    charts,
    fullChart,
    kdis,
    checks,
    month,
    setMonth,
    loadFullChart,
    createChart,
    deleteChart,
    updateTheme,
    updateSubGoal,
    upsertTask,
    upsertKdi,
    deleteKdi,
    toggleCheck,
    refreshKdis,
  };
}
