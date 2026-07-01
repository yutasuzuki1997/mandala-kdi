"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";
import * as db from "@/lib/db";
import { getUserId } from "@/lib/user";
import type { Chart, FullChart, Task, Kdi, KdiCheck } from "@/app/types";

/* ================================================================
   Types
   ================================================================ */

interface Props {
  charts: Chart[];
  fullChart: FullChart | null;
  kdis: Kdi[];
  checks: KdiCheck[];
  onSelectChart: (chartId: string) => void;
  onCreateChart: (name: string, theme: string) => void;
  onDeleteChart: (id: string) => void;
  onUpdateTheme: (chartId: string, theme: string) => void;
  onUpdateSubGoal: (id: string, label: string) => void;
  onSwapTask?: (aTaskId: string, bTaskId: string) => void;
  onUpsertTask: (data: Record<string, unknown>) => void;
  onUpsertKdi: (data: Record<string, unknown>) => void;
  onDeleteKdi: (id: string) => void;
  onRenameKdi?: (id: string, label: string) => void | Promise<void>;
  onRefreshKdis?: () => void | Promise<void>;
}

interface CellData {
  row: number;
  col: number;
  isCenter: boolean;
  isCenterBlock: boolean;
  isThemeCenter: boolean;
  label: string;
  task?: Task;
  sgId?: string;
  sgLabel?: string;
  taskPosition?: number;
}

const FONT_SANS = "'Noto Sans JP', sans-serif";
const FONT_SERIF = "'Zen Maru Gothic', sans-serif";
const FONT = FONT_SANS;

/* Bank-style green palette */
const C_PAPER = "#ffffff";
const C_PAPER_DEEP = "#e6f1e6";
const C_INK = "#2c3a2e";
const C_INK_SOFT = "#1f6d39";
const C_BROWN = "#2e9e4f";
const C_BROWN_SOFT = "#bcd9bd";
const C_BG = "#f1f7f1";
const C_GOLD = "#f3982d";
const C_SUCCESS_BG = "#e9f6ec";
const C_DANGER_BG = "#fdecec";
const C_WARN_BG = "#fff4e2";

/* ================================================================
   FitText
   ================================================================ */

function FitText({
  text,
  isCenter,
  isTheme,
  isSgCenter,
}: {
  text: string;
  isCenter: boolean;
  isTheme?: boolean;
  isSgCenter?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const spanRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(isCenter ? 13 : 11);
  const [truncated, setTruncated] = useState(false);

  const max = isCenter ? 13 : 11;
  const min = 9;

  useLayoutEffect(() => {
    const box = boxRef.current;
    const span = spanRef.current;
    if (!box || !span || !text) {
      setTruncated(false);
      return;
    }
    setTruncated(false);
    let s = max;
    span.style.fontSize = `${s}px`;
    while (s > min) {
      span.style.fontSize = `${s}px`;
      if (
        span.scrollHeight <= box.clientHeight &&
        span.scrollWidth <= box.clientWidth
      )
        break;
      s -= 0.5;
    }
    span.style.fontSize = `${s}px`;
    if (
      s <= min &&
      (span.scrollHeight > box.clientHeight ||
        span.scrollWidth > box.clientWidth)
    ) {
      setTruncated(true);
    }
    setFontSize(s);
  }, [text, isCenter, max, min]);

  if (!text) return null;

  return (
    <div
      ref={boxRef}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        padding: "2px 3px",
      }}
    >
      <span
        ref={spanRef}
        style={{
          fontSize,
          lineHeight: 1.25,
          textAlign: "center",
          wordBreak: "normal",
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          fontFamily: isTheme || isSgCenter ? FONT_SERIF : FONT_SANS,
          color: isTheme ? C_BG : "inherit",
          fontWeight: isTheme ? 600 : isSgCenter ? 600 : isCenter ? 500 : 400,
          letterSpacing: isTheme || isSgCenter ? "0.02em" : "normal",
          ...(truncated
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical" as const,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }
            : {}),
        }}
      >
        {text}
      </span>
    </div>
  );
}

/* ================================================================
   KDI rate helper
   ================================================================ */

function calcKdiRate(kdi: Kdi, checks: KdiCheck[]): number {
  const kdiChecks = checks.filter((c) => c.kdi_id === kdi.id);
  // Achievement-type: binary — achieved (100) or not (0). No monthly rate.
  if (kdi.freq === "once") {
    return kdiChecks.length > 0 ? 100 : 0;
  }
  const now = new Date();
  if (kdi.freq === "daily") {
    const elapsed = now.getDate();
    return elapsed > 0 ? Math.round((kdiChecks.length / elapsed) * 100) : 0;
  }
  const target = kdi.target_per_month ?? 4;
  return target > 0 ? Math.round((kdiChecks.length / target) * 100) : 0;
}

/* ================================================================
   Badge & background for a task cell
   ================================================================ */

type BadgeInfo = { char: string; bg: string; color: string } | null;

function getCellBadgeAndBg(
  cell: CellData,
  kdis: Kdi[],
  checks: KdiCheck[]
): { badge: BadgeInfo; bg: string } {
  if (!cell.task || cell.isCenter || cell.isCenterBlock)
    return { badge: null, bg: C_PAPER };

  const task = cell.task;
  const today = new Date().toISOString().slice(0, 10);
  const taskKdis = kdis.filter((k) => k.task_id === task.id);
  const overdue = task.deadline && task.deadline < today && task.status !== "done";

  if (task.status === "done") {
    return {
      badge: { char: "✓", bg: "#4a7c59", color: "#faf8f3" },
      bg: C_SUCCESS_BG,
    };
  }

  if (overdue) {
    return {
      badge: { char: "!", bg: "#b84444", color: "#faf8f3" },
      bg: C_DANGER_BG,
    };
  }

  if (taskKdis.length > 0) {
    let worstRate = 100;
    for (const kdi of taskKdis) {
      const r = calcKdiRate(kdi, checks);
      if (r < worstRate) worstRate = r;
    }
    if (worstRate >= 80) {
      return {
        badge: { char: "✓", bg: "#4a7c59", color: "#faf8f3" },
        bg: C_SUCCESS_BG,
      };
    }
    if (worstRate >= 50) {
      return { badge: null, bg: C_WARN_BG };
    }
    return {
      badge: { char: "↓", bg: C_GOLD, color: C_INK },
      bg: C_WARN_BG,
    };
  }

  return { badge: null, bg: C_PAPER };
}

/* ================================================================
   Build flat 81-cell grid
   ================================================================ */

function buildGrid(fullChart: FullChart): CellData[] {
  const sgs = [...(fullChart.sub_goals ?? [])].sort(
    (a, b) => a.position - b.position
  );

  const blocks: CellData[][] = [];
  for (let bIdx = 0; bIdx < 9; bIdx++) {
    const cells: CellData[] = [];
    if (bIdx === 4) {
      for (let cIdx = 0; cIdx < 9; cIdx++) {
        if (cIdx === 4) {
          cells.push({
            row: 0, col: 0, isCenter: true, isCenterBlock: true,
            isThemeCenter: true, label: fullChart.theme,
          });
        } else {
          const sgPos = cIdx > 4 ? cIdx - 1 : cIdx;
          const sg = sgs[sgPos];
          cells.push({
            row: 0, col: 0, isCenter: false, isCenterBlock: true,
            isThemeCenter: false, label: sg?.label ?? "",
            sgId: sg?.id, sgLabel: sg?.label,
          });
        }
      }
    } else {
      const sgPos = bIdx > 4 ? bIdx - 1 : bIdx;
      const sg = sgs[sgPos];
      const tasks = [...(sg?.tasks ?? [])].sort(
        (a, b) => a.position - b.position
      );
      for (let cIdx = 0; cIdx < 9; cIdx++) {
        if (cIdx === 4) {
          cells.push({
            row: 0, col: 0, isCenter: true, isCenterBlock: false,
            isThemeCenter: false, label: sg?.label ?? "",
            sgId: sg?.id, sgLabel: sg?.label,
          });
        } else {
          const tPos = cIdx > 4 ? cIdx - 1 : cIdx;
          const task = tasks.find((t) => t.position === tPos);
          cells.push({
            row: 0, col: 0, isCenter: false, isCenterBlock: false,
            isThemeCenter: false, label: task?.label ?? "",
            task, sgId: sg?.id, sgLabel: sg?.label, taskPosition: tPos,
          });
        }
      }
    }
    blocks.push(cells);
  }

  const flat: CellData[] = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const bIdx = Math.floor(row / 3) * 3 + Math.floor(col / 3);
      const cIdx = (row % 3) * 3 + (col % 3);
      flat.push({ ...blocks[bIdx][cIdx], row, col });
    }
  }
  return flat;
}

/* ================================================================
   Cell inline style (no left-accent ring — badge replaces it)
   ================================================================ */

function getCellStyle(
  cell: CellData,
  bg: string
): React.CSSProperties {
  const { row, col } = cell;

  let cellBg = bg;
  if (cell.isThemeCenter) cellBg = C_INK;
  else if (cell.isCenter) cellBg = C_PAPER_DEEP;
  else if (cell.isCenterBlock) cellBg = C_PAPER_DEEP;

  // Cell borders: 0.5px cream-brown
  let borderTop = `0.5px solid ${C_BROWN_SOFT}`;
  let borderLeft = `0.5px solid ${C_BROWN_SOFT}`;
  let borderRight = `0.5px solid ${C_BROWN_SOFT}`;
  let borderBottom = `0.5px solid ${C_BROWN_SOFT}`;

  // Block boundaries: 1.5px brown
  if (col === 2 || col === 5) borderRight = `1.5px solid ${C_BROWN}`;
  if (col === 3 || col === 6) borderLeft = `1.5px solid ${C_BROWN}`;
  if (row === 2 || row === 5) borderBottom = `1.5px solid ${C_BROWN}`;
  if (row === 3 || row === 6) borderTop = `1.5px solid ${C_BROWN}`;

  // Outer edges: handled by container's 2px border
  if (row === 0) borderTop = "none";
  if (col === 0) borderLeft = "none";
  if (row === 8) borderBottom = "none";
  if (col === 8) borderRight = "none";

  return {
    position: "relative" as const,
    background: cellBg,
    color: cell.isThemeCenter ? C_BG : C_INK,
    borderTop,
    borderRight,
    borderBottom,
    borderLeft,
    fontWeight: cell.isCenter ? 600 : "normal",
    opacity: cell.task?.status === "done" ? 0.6 : 1,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 0,
    margin: 0,
    minWidth: 0,
    minHeight: 0,
    fontFamily: FONT,
    transition: "background 0.1s",
  };
}

/* ================================================================
   Summary bar
   ================================================================ */

function useSummary(
  fullChart: FullChart | null,
  kdis: Kdi[],
  checks: KdiCheck[]
) {
  return useMemo(() => {
    if (!fullChart) return null;
    const allTasks: Task[] = [];
    for (const sg of fullChart.sub_goals ?? [])
      for (const t of sg.tasks ?? []) allTasks.push(t);
    const today = new Date().toISOString().slice(0, 10);

    let achieved = 0;
    let totalKdi = 0;
    let overdue = 0;
    let warning = 0;

    for (const kdi of kdis) {
      const task = allTasks.find((t) => t.id === kdi.task_id);
      if (!task) continue;
      totalKdi++;
      const rate = calcKdiRate(kdi, checks);
      if (rate >= kdi.threshold) achieved++;
      if (rate < 50) warning++;
    }
    for (const t of allTasks) {
      if (t.deadline && t.deadline < today && t.status !== "done") overdue++;
    }
    return { achieved, totalKdi, overdue, warning };
  }, [fullChart, kdis, checks]);
}

/* ================================================================
   MandalaGrid
   ================================================================ */

function MandalaGrid({
  cells,
  kdis,
  checks,
  onCellClick,
  onSwapTask,
}: {
  cells: CellData[];
  kdis: Kdi[];
  checks: KdiCheck[];
  onCellClick: (cell: CellData) => void;
  onSwapTask?: (aTaskId: string, bTaskId: string) => void;
}) {
  // Pointer-based drag & drop to reorder sub-KPI (task) cells WITHIN the same KPI
  // block. Uses Pointer Events so it works on both touch (mobile/PWA) and mouse.
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [overTaskId, setOverTaskId] = useState<string | null>(null);
  const dragMeta = useRef<{
    id: string;
    sgId: string;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const overRef = useRef<string | null>(null);
  const suppressClick = useRef(false);
  const [tooltip, setTooltip] = useState<{
    text: string;
    left: number;
    top: number;
    placement: "top" | "bottom";
  } | null>(null);

  const showTooltip = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, text: string) => {
      // Skip on touch / coarse-pointer devices — mobile uses the edit modal
      // (opened on tap) to show full text.
      if (
        typeof window !== "undefined" &&
        !window.matchMedia("(hover: hover) and (pointer: fine)").matches
      )
        return;
      if (!text) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceAbove = rect.top;
      const placement: "top" | "bottom" = spaceAbove > 60 ? "top" : "bottom";
      setTooltip({
        text,
        left: rect.left + rect.width / 2,
        top: placement === "top" ? rect.top : rect.bottom,
        placement,
      });
    },
    []
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(9, minmax(0, 1fr))",
        gridTemplateRows: "repeat(9, minmax(0, 1fr))",
        border: `2px solid ${C_BROWN}`,
        background: C_BG,
        aspectRatio: "1 / 1",  /* perfect square chart */
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {cells.map((cell, i) => {
        const { badge, bg } = getCellBadgeAndBg(cell, kdis, checks);
        const style = getCellStyle(cell, bg);
        const restoreBg = style.background as string;
        const isSgCenter =
          (!cell.isCenterBlock && cell.isCenter) ||
          (cell.isCenterBlock && !cell.isThemeCenter);
        // Sub-KPI (task) cell: draggable to reorder within its KPI block.
        const isTaskCell =
          !cell.isCenter &&
          !cell.isCenterBlock &&
          !!cell.task &&
          !!cell.sgId &&
          !!onSwapTask;
        const taskId = cell.task?.id;
        const isDragging = isTaskCell && dragTaskId === taskId;
        const isDropTarget =
          isTaskCell && overTaskId === taskId && dragTaskId !== taskId;
        const dndStyle: React.CSSProperties = {
          ...style,
          ...(isTaskCell
            ? { cursor: dragTaskId ? "grabbing" : "grab", touchAction: "none" }
            : {}),
          ...(isDragging ? { opacity: 0.35 } : {}),
          ...(isDropTarget
            ? { outline: `2px solid ${C_GOLD}`, outlineOffset: -2, zIndex: 2 }
            : {}),
        };
        return (
          <button
            key={i}
            type="button"
            title={cell.label || undefined}
            data-taskid={isTaskCell ? taskId : undefined}
            data-sgid={isTaskCell ? cell.sgId : undefined}
            onPointerDown={
              isTaskCell
                ? (e) => {
                    dragMeta.current = {
                      id: taskId!,
                      sgId: cell.sgId!,
                      startX: e.clientX,
                      startY: e.clientY,
                      moved: false,
                    };
                    try {
                      e.currentTarget.setPointerCapture(e.pointerId);
                    } catch {}
                  }
                : undefined
            }
            onPointerMove={
              isTaskCell
                ? (e) => {
                    const m = dragMeta.current;
                    if (!m) return;
                    if (!m.moved) {
                      if (
                        Math.hypot(e.clientX - m.startX, e.clientY - m.startY) <
                        8
                      )
                        return;
                      m.moved = true;
                      setDragTaskId(m.id);
                    }
                    const el = document.elementFromPoint(
                      e.clientX,
                      e.clientY
                    ) as HTMLElement | null;
                    const btn = el?.closest(
                      "[data-taskid]"
                    ) as HTMLElement | null;
                    const tid = btn?.getAttribute("data-taskid") ?? null;
                    const sid = btn?.getAttribute("data-sgid") ?? null;
                    const next =
                      tid && sid === m.sgId && tid !== m.id ? tid : null;
                    overRef.current = next;
                    setOverTaskId(next);
                  }
                : undefined
            }
            onPointerUp={
              isTaskCell
                ? (e) => {
                    const m = dragMeta.current;
                    dragMeta.current = null;
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {}
                    if (m && m.moved) {
                      suppressClick.current = true;
                      const target = overRef.current;
                      if (target && target !== m.id) onSwapTask!(m.id, target);
                    }
                    overRef.current = null;
                    setDragTaskId(null);
                    setOverTaskId(null);
                  }
                : undefined
            }
            onPointerCancel={
              isTaskCell
                ? () => {
                    dragMeta.current = null;
                    overRef.current = null;
                    setDragTaskId(null);
                    setOverTaskId(null);
                  }
                : undefined
            }
            onClick={() => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              onCellClick(cell);
            }}
            onMouseEnter={(e) => {
              if (!cell.isThemeCenter && !dragTaskId)
                e.currentTarget.style.background = "#f5f0e3";
              showTooltip(e, cell.label);
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = restoreBg;
              setTooltip(null);
            }}
            style={dndStyle}
          >
            <FitText
              text={cell.label}
              isCenter={cell.isCenter || cell.isThemeCenter}
              isTheme={cell.isThemeCenter}
              isSgCenter={isSgCenter}
            />
            {badge && (
              <span
                style={{
                  position: "absolute",
                  top: 2,
                  right: 2,
                  width: 12,
                  height: 12,
                  borderRadius: 0,
                  background: badge.bg,
                  color: badge.color,
                  fontSize: 9,
                  lineHeight: "12px",
                  textAlign: "center",
                  fontFamily: FONT_SANS,
                  fontWeight: 700,
                  pointerEvents: "none",
                }}
              >
                {badge.char}
              </span>
            )}
          </button>
        );
      })}
      {tooltip && (
        <div
          role="tooltip"
          style={{
            position: "fixed",
            left: tooltip.left,
            top: tooltip.top,
            transform:
              tooltip.placement === "top"
                ? "translate(-50%, calc(-100% - 6px))"
                : "translate(-50%, 6px)",
            background: C_INK,
            color: C_BG,
            fontSize: 12,
            lineHeight: 1.4,
            padding: "6px 10px",
            borderRadius: 4,
            maxWidth: 200,
            wordBreak: "keep-all",
            overflowWrap: "break-word",
            whiteSpace: "pre-wrap",
            zIndex: 50,
            pointerEvents: "none",
            fontFamily: FONT_SANS,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}

/* ================================================================
   Paste parser (tab-separated)
   ================================================================ */

function parseGrid(text: string, rows: number, cols: number): string[][] | null {
  const lines = text.replace(/\r/g, "").split("\n");
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  if (lines.length < rows) return null;
  const grid: string[][] = [];
  for (let r = 0; r < rows; r++) {
    const cells = lines[r].split("\t");
    if (cells.length < cols) return null;
    grid.push(cells.slice(0, cols));
  }
  return grid;
}

/* ================================================================
   Detail parser (1 row = 1 task / KDI line, tab-separated)
   Columns: KPI | サブKPI | タイプ | 期日 | KDI | 頻度 | 月目標 | 閾値 | KDI期日 | KDI開始日(任意)
   ================================================================ */

type DetailKdi = {
  label: string;
  freq: "daily" | "weekly" | "monthly" | "once";
  target_per_month: number | null;
  threshold: number;
  start_date: string | null;
  deadline: string | null;
};
type DetailTask = {
  label: string;
  type: "achieve" | "habit";
  deadline: string | null;
  kdis: DetailKdi[];
};
type DetailKpi = { label: string; tasks: DetailTask[] };
type DetailParse = { theme: string | null; kpis: DetailKpi[] };

function normType(s: string): "achieve" | "habit" {
  const v = s.trim().toLowerCase();
  return v === "habit" || v === "習慣" ? "habit" : "achieve";
}
function normFreq(s: string): "daily" | "weekly" | "monthly" | "once" {
  const v = s.trim().toLowerCase();
  if (v === "weekly" || v === "毎週" || v === "週") return "weekly";
  if (v === "monthly" || v === "毎月" || v === "月次" || v === "月") return "monthly";
  if (v === "daily" || v === "毎日" || v === "日") return "daily";
  // Empty / unspecified frequency = one-time achievement (once).
  return "once";
}
function normNum(s: string): number | null {
  const v = s.replace(/[^0-9.]/g, "");
  if (!v) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function parseDetail(
  text: string
): { data: DetailParse } | { error: string } {
  const lines = text.replace(/\r/g, "").split("\n");
  let theme: string | null = null;
  const kpis: DetailKpi[] = [];
  const kpiByLabel = new Map<string, DetailKpi>();

  for (const raw of lines) {
    if (raw.trim() === "") continue;
    const cells = raw.split("\t").map((c) => c.trim());
    const first = cells[0] ?? "";

    if (/^(kgi|テーマ|中心テーマ)$/i.test(first)) {
      theme = (cells[1] ?? "").trim() || theme;
      continue;
    }
    if (/^(kpi|サブ目標)$/i.test(first)) continue; // header row

    const kpiLabel = cells[0] ?? "";
    const taskLabel = cells[1] ?? "";
    const typeS = cells[2] ?? "";
    const taskDeadline = cells[3] ?? "";
    const kdiLabel = cells[4] ?? "";
    const freqS = cells[5] ?? "";
    const targetS = cells[6] ?? "";
    const thresholdS = cells[7] ?? "";
    const kdiDeadline = cells[8] ?? "";
    const kdiStart = cells[9] ?? "";

    let kpi: DetailKpi | undefined;
    if (kpiLabel) {
      kpi = kpiByLabel.get(kpiLabel);
      if (!kpi) {
        kpi = { label: kpiLabel, tasks: [] };
        kpiByLabel.set(kpiLabel, kpi);
        kpis.push(kpi);
      }
    } else {
      kpi = kpis[kpis.length - 1];
    }
    if (!kpi) return { error: "最初のデータ行にKPI名が必要です" };

    let task: DetailTask | undefined;
    if (taskLabel) {
      // Same サブKPI repeated on consecutive rows = additional KDIs for the
      // same task (spreadsheet-style export), not a new task.
      const last = kpi.tasks[kpi.tasks.length - 1];
      if (last && last.label === taskLabel) {
        task = last;
      } else {
        task = {
          label: taskLabel,
          type: normType(typeS),
          deadline: taskDeadline.trim() || null,
          kdis: [],
        };
        kpi.tasks.push(task);
      }
    } else {
      task = kpi.tasks[kpi.tasks.length - 1];
    }

    if (kdiLabel) {
      if (!task)
        return { error: `KDI「${kdiLabel}」に対応するサブKPIがありません` };
      const freq = normFreq(freqS);
      task.kdis.push({
        label: kdiLabel,
        freq,
        target_per_month:
          freq === "weekly" || freq === "monthly" ? normNum(targetS) ?? 4 : null,
        threshold: freq === "once" ? 100 : normNum(thresholdS) ?? 90,
        start_date: kdiStart.trim() || null,
        deadline: kdiDeadline.trim() || null,
      });
    }
  }

  if (kpis.length === 0) return { error: "データ行がありません" };
  if (kpis.length > 8)
    return { error: `KPIは最大8件です（${kpis.length}件検出）` };
  for (const k of kpis) {
    if (k.tasks.length > 8)
      return {
        error: `「${k.label}」のサブKPIが8件を超えています（${k.tasks.length}件）`,
      };
  }
  return { data: { theme, kpis } };
}

/* ================================================================
   Import template download + prompt collection
   ================================================================ */

const TEMPLATE_TSV = [
  "KGI\t中心目標をここに",
  "KPI\tサブKPI\tタイプ\t期日\tKDI\t頻度\t月目標\t閾値\tKDI期日\tKDI開始日",
  "体力作り\t毎朝走る\thabit\t\t5km走る\tdaily\t\t90\t",
  "体力作り\t筋トレ\thabit\t2026-09-01\t腕立て30回\tweekly\t12\t80\t2026-08-31",
  "資格取得\t過去問演習\tachieve\t2026-09-01\t\t\t\t\t",
].join("\n");

function downloadTemplate() {
  // BOM so Excel opens Japanese TSV without mojibake.
  const blob = new Blob(["﻿" + TEMPLATE_TSV], {
    type: "text/tab-separated-values;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mandala-import-template.tsv";
  a.click();
  URL.revokeObjectURL(url);
}

const PROMPTS: { title: string; desc: string; body: string }[] = [
  {
    title: "① 目標を整理する（最初にClaudeへ渡す）",
    desc: "Claudeと壁打ちしながらKGI→KPI→サブKPI→KDIを設計します。",
    body: `あなたは目標設計のコーチです。私の目標をマンダラチャート（オープンウィンドウ64）の構造で一緒に整理してください。

【構造】
- KGI: 中心に置く最終目標（1つ）
- KPI: KGI達成に必要な要素（最大8つ）
- サブKPI: 各KPIを達成するための具体的な行動・課題（各KPIにつき最大8つ）。「達成型(achieve＝一度やれば完了)」か「習慣型(habit＝継続)」のどちらか。任意で期日を持てる。
- KDI: 各サブKPIの達成度を測る指標（1サブKPIに複数可）。頻度は daily / weekly / monthly / once。週次・月次は「月の目標回数」、達成基準の「閾値(%)」、任意で「開始日」「期日」を持てる。

【進め方】
1. まず私のKGI（中心目標）をヒアリングして言語化する
2. KGI達成に必要なKPIを一緒に洗い出す（最大8）
3. 各KPIごとにサブKPIを具体化する（各最大8、達成型/習慣型と期日も）
4. 各サブKPIに紐づくKDIを設計する（頻度・回数・閾値・期日）
5. 抜け漏れや曖昧さを質問で深掘りする

一度に全部聞かず、1ステップずつ対話で進めてください。まずは私のKGIから質問してください。`,
  },
  {
    title: "② インポート形式に変換する（整理し終わったら渡す）",
    desc: "対話で決めた内容を、このアプリに貼り付けられるタブ区切り表に変換します。",
    body: `ここまでで整理したマンダラチャートの内容を、下記フォーマットのタブ区切りテキストに変換し、コードブロックで出力してください。説明文は不要です。

【ルール】
- 1行目は「KGI<TAB>中心目標の文言」（<TAB>は半角タブ文字）
- 2行目はヘッダ: KPI<TAB>サブKPI<TAB>タイプ<TAB>期日<TAB>KDI<TAB>頻度<TAB>月目標<TAB>閾値<TAB>KDI期日<TAB>KDI開始日
- 3行目以降が「1行＝1サブKPI」
- 列の区切りはすべて半角タブ文字。値が無い列は空欄（タブは省略せず詰めない）
- タイプ: achieve（達成型）/ habit（習慣型）
- 頻度: daily / weekly / monthly / once。月目標は weekly・monthly のとき数値、閾値は % の数値（once は空でよい）、期日・開始日は YYYY-MM-DD（開始日は任意・最終列）
- 1つのサブKPIに複数KDIがある場合、2件目以降はKPI列とサブKPI列を空欄にして次の行に書く（直前のサブKPIに紐づく）
- KPIは最大8、各KPIのサブKPIは最大8

【出力例（タブ区切り）】
KGI	中心目標
KPI	サブKPI	タイプ	期日	KDI	頻度	月目標	閾値	KDI期日	KDI開始日
体力作り	毎朝走る	habit		5km走る	daily		90
			ストレッチ	daily		80
資格取得	過去問演習	achieve	2026-09-01				`,
  },
];

/* ================================================================
   Main Component
   ================================================================ */

export default function ChartView({
  charts,
  fullChart,
  kdis,
  checks,
  onSelectChart,
  onCreateChart,
  onDeleteChart,
  onUpdateTheme,
  onUpdateSubGoal,
  onSwapTask,
  onUpsertTask,
  onUpsertKdi,
  onDeleteKdi,
  onRenameKdi,
  onRefreshKdis,
}: Props) {
  const [selectedChartId, setSelectedChartId] = useState("");

  const [showCreateChart, setShowCreateChart] = useState(false);
  const [newChartName, setNewChartName] = useState("");
  const [newChartTheme, setNewChartTheme] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [editingTheme, setEditingTheme] = useState(false);
  const [themeLabel, setThemeLabel] = useState("");

  const [editingSg, setEditingSg] = useState<CellData | null>(null);
  const [sgLabel, setSgLabel] = useState("");

  const [editingTask, setEditingTask] = useState<CellData | null>(null);
  const [taskForm, setTaskForm] = useState({
    label: "",
    type: "achieve" as "achieve" | "habit",
    deadline: "",
  });
  const [showKdiForm, setShowKdiForm] = useState(false);
  const [kdiForm, setKdiForm] = useState({
    label: "",
    freq: "daily" as "daily" | "weekly" | "monthly" | "once",
    target_per_month: 4,
    threshold: 90,
    start_date: "",
    deadline: "",
  });

  const [fullscreen, setFullscreen] = useState(false);

  // Import state
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<"block" | "full" | "detail">(
    "block"
  );
  const [importText, setImportText] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importSgIdx, setImportSgIdx] = useState(0);
  const [importError, setImportError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const copyPrompt = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    });
  }, []);

  useEffect(() => {
    if (charts.length > 0 && !selectedChartId) {
      setSelectedChartId(charts[0].id);
      onSelectChart(charts[0].id);
    }
  }, [charts, selectedChartId, onSelectChart]);

  const cells = useMemo(
    () => (fullChart ? buildGrid(fullChart) : null),
    [fullChart]
  );

  const summary = useSummary(fullChart, kdis, checks);

  // All KDIs for the current editing task
  const taskKdis = useMemo(() => {
    if (!editingTask?.task) return [];
    return kdis.filter((k) => k.task_id === editingTask.task!.id);
  }, [editingTask, kdis]);

  /* ------ Cell click dispatcher ------ */
  const handleCellClick = useCallback((cell: CellData) => {
    if (cell.isThemeCenter) {
      setThemeLabel(cell.label);
      setEditingTheme(true);
      return;
    }
    if (
      (cell.isCenterBlock && !cell.isCenter && cell.sgId) ||
      (!cell.isCenterBlock && cell.isCenter && cell.sgId)
    ) {
      setEditingSg(cell);
      setSgLabel(cell.sgLabel ?? cell.label);
      return;
    }
    if (!cell.isCenterBlock && !cell.isCenter && cell.sgId) {
      setEditingTask(cell);
      setTaskForm({
        label: cell.task?.label ?? "",
        type: cell.task?.type ?? "achieve",
        deadline: cell.task?.deadline ?? "",
      });
      setShowKdiForm(false);
      resetKdiForm(cell.task?.label ?? "", cell.task?.deadline ?? "");
    }
  }, []);

  function resetKdiForm(label: string, deadline: string) {
    setKdiForm({
      label,
      freq: "daily",
      target_per_month: 4,
      threshold: 90,
      start_date: "",
      deadline,
    });
  }

  /* ------ Save handlers ------ */
  const saveTheme = useCallback(() => {
    if (!fullChart || !themeLabel.trim()) return;
    onUpdateTheme(fullChart.id, themeLabel);
    setEditingTheme(false);
  }, [fullChart, themeLabel, onUpdateTheme]);

  const saveSg = useCallback(() => {
    if (!editingSg?.sgId) return;
    onUpdateSubGoal(editingSg.sgId, sgLabel);
    setEditingSg(null);
  }, [editingSg, sgLabel, onUpdateSubGoal]);

  const saveTask = useCallback(() => {
    if (!editingTask) return;
    onUpsertTask({
      ...(editingTask.task?.id ? { id: editingTask.task.id } : {}),
      sub_goal_id: editingTask.sgId,
      position: editingTask.task?.position ?? editingTask.taskPosition,
      label: taskForm.label,
      type: taskForm.type,
      deadline: taskForm.deadline || null,
    });
    setEditingTask(null);
  }, [editingTask, taskForm, onUpsertTask]);

  const completeTask = useCallback(() => {
    if (!editingTask?.task) return;
    onUpsertTask({ id: editingTask.task.id, status: "done" });
    setEditingTask(null);
  }, [editingTask, onUpsertTask]);

  const saveKdi = useCallback(() => {
    if (!editingTask?.task) return;
    onUpsertKdi({
      task_id: editingTask.task.id,
      label: kdiForm.label || taskForm.label,
      freq: kdiForm.freq,
      target_per_month:
        kdiForm.freq === "weekly" || kdiForm.freq === "monthly"
          ? kdiForm.target_per_month
          : null,
      // Achievement-type is binary: threshold is conceptually "achieved once".
      threshold: kdiForm.freq === "once" ? 100 : kdiForm.threshold,
      start_date: kdiForm.start_date || null,
      deadline: kdiForm.deadline || null,
    });
    setShowKdiForm(false);
  }, [editingTask, kdiForm, taskForm.label, onUpsertKdi]);

  const handleDeleteChart = useCallback(() => {
    onDeleteChart(selectedChartId);
    setShowDeleteConfirm(false);
    setSelectedChartId("");
  }, [selectedChartId, onDeleteChart]);

  /* ------ Import ------ */
  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // allow re-selecting the same file
      if (!file) return;
      setImportError(null);
      try {
        const text = await file.text();
        setImportText(text);
        setImportFileName(file.name);
      } catch {
        setImportError("ファイルの読み込みに失敗しました");
        setImportText("");
        setImportFileName("");
      }
    },
    []
  );

  const handleImport = useCallback(async () => {
    if (!fullChart) return;
    setImportError(null);
    setImporting(true);
    try {
      const sgs = [...(fullChart.sub_goals ?? [])].sort(
        (a, b) => a.position - b.position
      );
      const ops: Promise<unknown>[] = [];

      if (importMode === "detail") {
        const parsed = parseDetail(importText);
        if ("error" in parsed) {
          setImportError(parsed.error);
          setImporting(false);
          return;
        }
        const { theme, kpis } = parsed.data;
        const uid = await getUserId();
        if (theme) await db.updateChartTheme(fullChart.id, theme);

        // Non-destructive: match existing sub_goals/tasks by label and only fill
        // empty slots for genuinely new KPIs/tasks. Existing labels/deadlines are
        // never overwritten — this path only ADDS (or updates) KDIs.
        const sgWork = sgs.map((sg) => ({
          sg,
          tasks: [...(sg.tasks ?? [])].sort((a, b) => a.position - b.position),
        }));

        for (const kpi of kpis) {
          // Resolve the sub-goal by label; claim an empty slot for a new KPI.
          let entry = sgWork.find((e) => e.sg.label === kpi.label);
          if (!entry) {
            const empty = sgWork.find((e) => !e.sg.label);
            if (!empty) continue; // no room for another KPI
            await db.updateSubGoal(empty.sg.id, kpi.label);
            empty.sg.label = kpi.label;
            entry = empty;
          }
          const sg = entry.sg;

          for (const t of kpi.tasks) {
            // Resolve the task by label; create a new one only in an empty slot.
            let task = entry.tasks.find((x) => t.label && x.label === t.label);
            if (!task) {
              const emptyRow = entry.tasks.find((x) => !x.label);
              if (!emptyRow) continue; // grid full, no room for a new task
              const row = await db.upsertTask({
                id: emptyRow.id,
                sub_goal_id: sg.id,
                position: emptyRow.position,
                label: t.label,
                type: t.type,
                deadline: t.deadline,
              });
              emptyRow.label = t.label; // mark slot as claimed
              task = row as typeof emptyRow;
            }
            const taskId = (task as { id: string }).id;
            for (const k of t.kdis) {
              if (!k.label) continue;
              const existingKdi = kdis.find(
                (x) => x.task_id === taskId && x.label === k.label
              );
              await db.upsertKdi({
                ...(existingKdi ? { id: existingKdi.id } : {}),
                task_id: taskId,
                user_id: uid,
                label: k.label,
                freq: k.freq,
                target_per_month: k.target_per_month,
                threshold: k.threshold,
                start_date: k.start_date,
                deadline: k.deadline,
              });
            }
          }
        }
      } else if (importMode === "block") {
        const grid = parseGrid(importText, 3, 3);
        if (!grid) {
          setImportError("3×3（9セル）のデータを貼り付けてください");
          setImporting(false);
          return;
        }
        const sg = sgs[importSgIdx];
        if (!sg) {
          setImportError("サブ目標が見つかりません");
          setImporting(false);
          return;
        }
        const centerLabel = grid[1][1].trim();
        if (centerLabel) ops.push(db.updateSubGoal(sg.id, centerLabel));
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            if (r === 1 && c === 1) continue;
            const label = grid[r][c]?.trim() ?? "";
            if (!label) continue;
            const cIdx = r * 3 + c;
            const tPos = cIdx > 4 ? cIdx - 1 : cIdx;
            const existing = sg.tasks?.find((t) => t.position === tPos);
            ops.push(
              db.upsertTask({
                ...(existing ? { id: existing.id } : {}),
                sub_goal_id: sg.id,
                position: tPos,
                label,
              })
            );
          }
        }
      } else {
        const grid = parseGrid(importText, 9, 9);
        if (!grid) {
          setImportError("9×9（81セル）のデータを貼り付けてください");
          setImporting(false);
          return;
        }
        for (let bIdx = 0; bIdx < 9; bIdx++) {
          const bRow = Math.floor(bIdx / 3);
          const bCol = bIdx % 3;
          for (let cIdx = 0; cIdx < 9; cIdx++) {
            const r = Math.floor(cIdx / 3);
            const c = cIdx % 3;
            const label = grid[bRow * 3 + r][bCol * 3 + c]?.trim() ?? "";
            if (!label) continue;
            if (bIdx === 4) {
              if (cIdx === 4) {
                ops.push(db.updateChartTheme(fullChart.id, label));
              } else {
                const sgPos = cIdx > 4 ? cIdx - 1 : cIdx;
                const sg = sgs[sgPos];
                if (sg) ops.push(db.updateSubGoal(sg.id, label));
              }
            } else {
              const sgPos = bIdx > 4 ? bIdx - 1 : bIdx;
              const sg = sgs[sgPos];
              if (!sg) continue;
              if (cIdx === 4) {
                ops.push(db.updateSubGoal(sg.id, label));
              } else {
                const tPos = cIdx > 4 ? cIdx - 1 : cIdx;
                const existing = sg.tasks?.find((t) => t.position === tPos);
                ops.push(
                  db.upsertTask({
                    ...(existing ? { id: existing.id } : {}),
                    sub_goal_id: sg.id,
                    position: tPos,
                    label,
                  })
                );
              }
            }
          }
        }
      }

      await Promise.all(ops);
      onSelectChart(fullChart.id);
      if (importMode === "detail") await onRefreshKdis?.();
      setToast("インポート完了");
      setShowImport(false);
      setImportText("");
      setImportFileName("");
      setTimeout(() => setToast(null), 2500);
    } catch (e: unknown) {
      setImportError(
        e instanceof Error ? e.message : "インポートに失敗しました"
      );
    } finally {
      setImporting(false);
    }
  }, [
    fullChart,
    importMode,
    importText,
    importSgIdx,
    kdis,
    onSelectChart,
    onRefreshKdis,
  ]);

  return (
    <div className="space-y-3">
      {/* ===== Chart Selector ===== */}
      <div className="flex items-center gap-3">
        <select
          value={selectedChartId}
          onChange={(e) => {
            setSelectedChartId(e.target.value);
            onSelectChart(e.target.value);
          }}
          className="flex-1 bg-transparent px-1 py-1.5 text-sm focus:outline-none"
          style={{
            borderBottom: `1px solid ${C_BROWN}`,
            color: C_INK,
            fontFamily: FONT_SERIF,
            fontWeight: 500,
          }}
        >
          {charts.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {charts.length > 0 && fullChart && (
          <button
            type="button"
            onClick={() => {
              setImportError(null);
              setImportText("");
              setImportFileName("");
              setShowImport(true);
            }}
            className="text-sm hover:underline"
            style={{ color: C_BROWN, fontFamily: FONT_SERIF }}
          >
            📋 インポート
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowCreateChart(true)}
          className="text-sm hover:underline"
          style={{ color: C_BROWN, fontFamily: FONT_SERIF }}
        >
          + 新規
        </button>
        {charts.length > 0 && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="text-xs hover:underline"
            style={{ color: C_BROWN, fontFamily: FONT_SERIF }}
          >
            削除
          </button>
        )}
      </div>

      {/* ===== Summary Bar ===== */}
      {summary && summary.totalKdi > 0 && (
        <div
          className="flex items-center gap-3 px-3 py-2"
          style={{
            fontFamily: FONT_SANS,
            fontSize: 12,
            background: C_PAPER_DEEP,
            color: C_INK_SOFT,
            borderBottom: `1px solid ${C_BROWN_SOFT}`,
          }}
        >
          <span>
            KDI達成中 <strong style={{ color: "#4a7c59" }}>{summary.achieved}/{summary.totalKdi}</strong>
          </span>
          {summary.overdue > 0 && <span style={{ color: "#b84444", fontWeight: 600 }}>期限切れ {summary.overdue}件</span>}
          {summary.warning > 0 && <span style={{ color: C_GOLD, fontWeight: 600 }}>要注意 {summary.warning}件</span>}
        </div>
      )}

      {/* ===== Grid ===== */}
      {cells && (
        <div className="relative w-full">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="absolute -top-6 right-0 z-10 text-[11px] hover:underline"
            style={{ color: C_BROWN, fontFamily: FONT_SERIF }}
          >
            拡大 ↗
          </button>
          <MandalaGrid cells={cells} kdis={kdis} checks={checks} onCellClick={handleCellClick} onSwapTask={onSwapTask} />
        </div>
      )}

      {!fullChart && charts.length > 0 && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      )}
      {charts.length === 0 && (
        <div className="py-12 text-center">
          <p className="mb-3 text-sm text-muted-foreground">チャートがありません</p>
          <Button onClick={() => setShowCreateChart(true)}>最初のチャートを作成</Button>
        </div>
      )}

      {/* ===== Fullscreen ===== */}
      {fullscreen && cells && (
        <div
          className="fixed inset-0 z-50 flex flex-col"
          style={{ background: C_BG }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: `1px solid ${C_BROWN_SOFT}` }}
          >
            <h3
              style={{ fontFamily: FONT_SERIF, fontWeight: 600, color: C_INK, fontSize: 15 }}
            >
              {fullChart?.name ?? "チャート"}
            </h3>
            <button
              onClick={() => setFullscreen(false)}
              className="text-sm hover:underline"
              style={{ color: C_BROWN, fontFamily: FONT_SERIF }}
            >
              閉じる
            </button>
          </div>
          <div className="flex flex-1 items-center justify-center p-4 overflow-auto">
            <div
              style={{
                width: "min(calc(100vw - 32px), calc((100vh - 120px) * 1.5))",
                maxWidth: "100%",
              }}
            >
              <MandalaGrid cells={cells} kdis={kdis} checks={checks} onCellClick={handleCellClick} onSwapTask={onSwapTask} />
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirm ===== */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="チャートを削除">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            「{charts.find((c) => c.id === selectedChartId)?.name}」を削除しますか？サブ目標・タスク・KDIも全て削除されます。
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>キャンセル</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteChart}>削除</Button>
          </div>
        </div>
      </Modal>

      {/* ===== Theme Edit ===== */}
      <Modal open={editingTheme} onClose={() => setEditingTheme(false)} title="中心テーマの編集">
        <div className="space-y-4">
          <textarea
            rows={3}
            value={themeLabel}
            onChange={(e) => setThemeLabel(e.target.value)}
            className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm"
            autoFocus
          />
          <Button className="w-full" disabled={!themeLabel.trim()} onClick={saveTheme}>保存</Button>
        </div>
      </Modal>

      {/* ===== Sub-Goal Edit ===== */}
      <Modal open={!!editingSg} onClose={() => setEditingSg(null)} title="サブ目標の編集">
        {editingSg && (
          <div className="space-y-4">
            <textarea
              rows={2}
              value={sgLabel}
              onChange={(e) => setSgLabel(e.target.value)}
              className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm"
              autoFocus
            />
            <Button className="w-full" disabled={!sgLabel.trim()} onClick={saveSg}>保存</Button>
          </div>
        )}
      </Modal>

      {/* ===== Task Edit Modal (large) ===== */}
      <Modal
        open={!!editingTask}
        onClose={() => { setEditingTask(null); setShowKdiForm(false); }}
        title="タスク設定"
        size="lg"
      >
        {editingTask && !showKdiForm && (
          <div className="space-y-5">
            {/* Task name */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">タスク名</label>
              <textarea
                rows={3}
                value={taskForm.label}
                onChange={(e) => setTaskForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm"
                placeholder="タスクを入力"
                autoFocus
              />
            </div>

            {/* Type */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">目標タイプ</label>
              <div className="flex gap-2">
                {(["achieve", "habit"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTaskForm((f) => ({ ...f, type: t }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${
                      taskForm.type === t ? "border-primary bg-primary/10 font-medium" : "bg-card"
                    }`}
                  >
                    {t === "achieve" ? "達成型" : "習慣型"}
                  </button>
                ))}
              </div>
            </div>

            {/* Deadline */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">期日</label>
              <input
                type="date"
                value={taskForm.deadline}
                onChange={(e) => setTaskForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            {/* Registered KDIs */}
            {taskKdis.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  登録済みKDI（{taskKdis.length}件）
                </label>
                <div className="space-y-2">
                  {taskKdis.map((kdi) => {
                    const rate = calcKdiRate(kdi, checks);
                    return (
                      <div key={kdi.id} className="flex items-center gap-2 rounded-lg border bg-card p-2.5">
                        <div className="flex-1 min-w-0">
                          <input
                            type="text"
                            defaultValue={kdi.label}
                            disabled={!onRenameKdi}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") e.currentTarget.blur();
                            }}
                            onBlur={async (e) => {
                              const next = e.target.value.trim();
                              if (!next || next === kdi.label) {
                                e.target.value = kdi.label;
                                return;
                              }
                              await onRenameKdi?.(kdi.id, next);
                              await onRefreshKdis?.();
                            }}
                            className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-input focus:border-primary focus:bg-background focus:outline-none"
                          />
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                              kdi.freq === "daily"
                                ? "bg-blue-100 text-blue-700"
                                : kdi.freq === "weekly"
                                ? "bg-purple-100 text-purple-700"
                                : kdi.freq === "monthly"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {kdi.freq === "daily" ? "デイリー" : kdi.freq === "weekly" ? "ウィークリー" : kdi.freq === "monthly" ? "マンスリー" : "達成型"}
                            </span>
                            {kdi.freq === "once" ? (
                              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                                rate >= 100 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                              }`}>
                                {rate >= 100 ? "達成済み" : "未達"}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${
                                rate >= 80 ? "bg-green-100 text-green-700" : rate >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                              }`}>
                                実行率 {rate}%
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteKdi(kdi.id)}
                          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button className="flex-1" disabled={!taskForm.label.trim()} onClick={saveTask}>保存</Button>
              {editingTask.task && editingTask.task.status !== "done" && (
                <Button variant="outline" onClick={completeTask}>完了</Button>
              )}
            </div>

            {/* Add KDI button — always available for existing tasks */}
            {editingTask.task && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  resetKdiForm(taskForm.label, taskForm.deadline);
                  setShowKdiForm(true);
                }}
              >
                + KDIを追加
              </Button>
            )}
          </div>
        )}

        {/* KDI creation form */}
        {editingTask && showKdiForm && (
          <div className="space-y-5">
            <button onClick={() => setShowKdiForm(false)} className="text-xs text-muted-foreground hover:underline">← タスク設定に戻る</button>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">KDI名</label>
              <input type="text" value={kdiForm.label} onChange={(e) => setKdiForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" autoFocus />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">頻度</label>
              <div className="grid grid-cols-2 gap-2">
                {(["daily", "weekly", "monthly", "once"] as const).map((f) => (
                  <button key={f} onClick={() => setKdiForm((fm) => ({ ...fm, freq: f }))}
                    className={`rounded-lg border px-3 py-2 text-sm transition ${kdiForm.freq === f ? "border-primary bg-primary/10 font-medium" : "bg-card"}`}>
                    {f === "daily" ? "デイリー" : f === "weekly" ? "ウィークリー" : f === "monthly" ? "マンスリー" : "達成型"}
                  </button>
                ))}
              </div>
            </div>
            {(kdiForm.freq === "weekly" || kdiForm.freq === "monthly") && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">月間目標回数</label>
                <input type="number" value={kdiForm.target_per_month}
                  onChange={(e) => setKdiForm((f) => ({ ...f, target_per_month: parseInt(e.target.value) || 4 }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
              </div>
            )}
            {kdiForm.freq !== "once" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">達成閾値（%）</label>
                <input type="number" value={kdiForm.threshold}
                  onChange={(e) => setKdiForm((f) => ({ ...f, threshold: parseInt(e.target.value) || 90 }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">開始日</label>
                <input type="date" value={kdiForm.start_date}
                  onChange={(e) => setKdiForm((f) => ({ ...f, start_date: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">期日</label>
                <input type="date" value={kdiForm.deadline}
                  onChange={(e) => setKdiForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
              </div>
            </div>
            <Button className="w-full" disabled={!kdiForm.label.trim()} onClick={saveKdi}>KDIを保存</Button>
          </div>
        )}
      </Modal>

      {/* ===== Create Chart ===== */}
      <Modal open={showCreateChart} onClose={() => setShowCreateChart(false)} title="新しいチャート">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">チャート名</label>
            <input type="text" value={newChartName} onChange={(e) => setNewChartName(e.target.value)}
              placeholder="マイチャート" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">中心テーマ</label>
            <input type="text" value={newChartTheme} onChange={(e) => setNewChartTheme(e.target.value)}
              placeholder="中心目標" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
          </div>
          <Button className="w-full" onClick={() => {
            onCreateChart(newChartName || "マイチャート", newChartTheme || "中心目標");
            setNewChartName(""); setNewChartTheme(""); setShowCreateChart(false);
          }}>作成</Button>
        </div>
      </Modal>

      {/* ===== Import ===== */}
      <Modal
        open={showImport}
        onClose={() => {
          if (!importing) setShowImport(false);
        }}
        title="スプレッドシートから貼り付け"
        size="lg"
      >
        <div className="space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-2">
            {(["block", "full", "detail"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setImportMode(m);
                  setImportError(null);
                  setImportText("");
                  setImportFileName("");
                }}
                className="flex-1 px-3 py-2 text-sm transition"
                style={{
                  background: importMode === m ? C_INK : "transparent",
                  color: importMode === m ? C_BG : C_INK_SOFT,
                  border: `1px solid ${importMode === m ? C_INK : C_BROWN_SOFT}`,
                  borderRadius: 4,
                  fontFamily: FONT_SERIF,
                  fontWeight: importMode === m ? 600 : 500,
                }}
              >
                {m === "block"
                  ? "ブロック（9セル）"
                  : m === "full"
                  ? "全体（81セル）"
                  : "詳細（全項目）"}
              </button>
            ))}
          </div>

          {/* Sub-goal selector (block mode) */}
          {importMode === "block" && fullChart && (
            <div>
              <label
                className="mb-1.5 block text-xs"
                style={{ color: C_INK_SOFT, fontFamily: FONT_SERIF, fontWeight: 500 }}
              >
                対象ブロック
              </label>
              <select
                value={importSgIdx}
                onChange={(e) => setImportSgIdx(parseInt(e.target.value))}
                className="w-full bg-transparent px-1 py-2 text-sm focus:outline-none"
                style={{
                  borderBottom: `1px solid ${C_BROWN}`,
                  color: C_INK,
                  fontFamily: FONT_SERIF,
                }}
              >
                {[...(fullChart.sub_goals ?? [])]
                  .sort((a, b) => a.position - b.position)
                  .map((sg, i) => (
                    <option key={sg.id} value={i}>
                      サブ目標{i + 1}{sg.label ? `：${sg.label}` : ""}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Template + prompts (detail mode) */}
          {importMode === "detail" && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadTemplate}
                className="px-3 py-1.5 text-xs"
                style={{
                  border: `1px solid ${C_BROWN_SOFT}`,
                  borderRadius: 4,
                  color: C_INK_SOFT,
                  fontFamily: FONT_SERIF,
                }}
              >
                ⬇ テンプレ(TSV)をダウンロード
              </button>
              <button
                type="button"
                onClick={() => setShowPrompts(true)}
                className="px-3 py-1.5 text-xs"
                style={{
                  border: `1px solid ${C_BROWN_SOFT}`,
                  borderRadius: 4,
                  color: C_INK_SOFT,
                  fontFamily: FONT_SERIF,
                }}
              >
                📖 プロンプト集を開く
              </button>
            </div>
          )}

          {/* Input: file upload (detail) or paste textarea (block/full) */}
          {importMode === "detail" ? (
            <div>
              <label
                className="mb-1.5 block text-xs"
                style={{ color: C_INK_SOFT, fontFamily: FONT_SERIF, fontWeight: 500 }}
              >
                TSVファイルをアップロード（ヘッダ付き・1行=1KDI）
              </label>
              <label
                className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border px-3 py-6 text-xs transition hover:opacity-80"
                style={{
                  borderColor: C_BROWN_SOFT,
                  borderStyle: "dashed",
                  background: C_BG,
                  color: importFileName ? C_INK : C_INK_SOFT,
                  fontFamily: FONT_SERIF,
                }}
              >
                {importFileName
                  ? `📄 ${importFileName}（クリックで選び直す）`
                  : "⬆ クリックして .tsv ファイルを選択"}
                <input
                  type="file"
                  accept=".tsv,.csv,.txt,text/tab-separated-values,text/csv,text/plain"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
          ) : (
            <div>
              <label
                className="mb-1.5 block text-xs"
                style={{ color: C_INK_SOFT, fontFamily: FONT_SERIF, fontWeight: 500 }}
              >
                {importMode === "block"
                  ? "3×3（9セル）タブ区切り"
                  : "9×9（81セル）タブ区切り"}
              </label>
              <textarea
                rows={10}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder={
                  importMode === "block"
                    ? "タスク1\tタスク2\tタスク3\nタスク4\tサブ目標\tタスク5\nタスク6\tタスク7\tタスク8"
                    : "9行×9列のデータをスプレッドシートからコピーして貼り付け"
                }
                className="w-full resize-none rounded-sm border px-3 py-2 text-xs font-mono focus:outline-none"
                style={{
                  borderColor: C_BROWN_SOFT,
                  background: C_BG,
                  color: C_INK,
                  fontFamily: "'Courier New', monospace",
                }}
              />
            </div>
          )}

          {importError && (
            <div
              className="px-3 py-2 text-xs"
              style={{
                background: "#fdf0f0",
                color: "#b84444",
                borderLeft: `3px solid #b84444`,
              }}
            >
              {importError}
            </div>
          )}

          {importMode === "detail" ? (
            <p
              className="text-[11px] leading-relaxed"
              style={{ color: C_BROWN, fontFamily: FONT_SANS }}
            >
              列: KPI / サブKPI / タイプ(achieve・habit) / 期日 / KDI / 頻度(daily・weekly・monthly・once) / 月目標(週次・月次) / 閾値% / KDI期日 / KDI開始日(任意・最終列)。
              既存のKPI名・サブKPI名は名前一致で照合し、一致すれば既存タスクにKDIを追記（既存の名前・期日は上書きしません）。一致しない場合のみ空きスロットに新規追加。先頭に「KGI(改行→tab)中心目標」でテーマも設定。
            </p>
          ) : (
            <p
              className="text-[11px]"
              style={{ color: C_BROWN, fontFamily: FONT_SANS }}
            >
              空セルはスキップされます（既存データは消えません）。
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              disabled={importing}
              onClick={() => setShowImport(false)}
            >
              キャンセル
            </Button>
            <Button
              className="flex-1"
              disabled={importing || !importText.trim()}
              onClick={handleImport}
            >
              {importing ? "処理中…" : "インポート"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ===== Prompt collection ===== */}
      <Modal
        open={showPrompts}
        onClose={() => setShowPrompts(false)}
        title="プロンプト集"
        size="lg"
      >
        <div className="space-y-4">
          <p
            className="text-xs leading-relaxed"
            style={{ color: C_BROWN, fontFamily: FONT_SANS }}
          >
            ①をClaude等に渡して目標を整理 →
            決まったら②を渡してタブ区切りに変換 →
            出力を .tsv ファイルに保存し「詳細（全項目）」タブからアップロード。
          </p>
          {PROMPTS.map((p, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${C_BROWN_SOFT}`,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                className="flex items-start justify-between gap-2 px-3 py-2"
                style={{ background: C_PAPER_DEEP }}
              >
                <div>
                  <div
                    className="text-sm"
                    style={{
                      color: C_INK,
                      fontFamily: FONT_SERIF,
                      fontWeight: 600,
                    }}
                  >
                    {p.title}
                  </div>
                  <div
                    className="text-[11px]"
                    style={{ color: C_INK_SOFT, fontFamily: FONT_SANS }}
                  >
                    {p.desc}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => copyPrompt(p.body, i)}
                  className="shrink-0 px-2.5 py-1 text-xs"
                  style={{
                    background: copiedIdx === i ? C_GOLD : C_INK,
                    color: C_BG,
                    borderRadius: 4,
                    fontFamily: FONT_SERIF,
                  }}
                >
                  {copiedIdx === i ? "コピー済" : "コピー"}
                </button>
              </div>
              <pre
                className="max-h-48 overflow-auto whitespace-pre-wrap px-3 py-2 text-[11px]"
                style={{
                  background: C_BG,
                  color: C_INK,
                  fontFamily: "'Courier New', monospace",
                  margin: 0,
                }}
              >
                {p.body}
              </pre>
            </div>
          ))}
        </div>
      </Modal>

      {/* ===== Toast ===== */}
      {toast && (
        <div
          className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 px-4 py-2 text-sm shadow-lg"
          style={{
            background: C_INK,
            color: C_BG,
            borderRadius: 4,
            fontFamily: FONT_SERIF,
            fontWeight: 500,
            letterSpacing: "0.05em",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
