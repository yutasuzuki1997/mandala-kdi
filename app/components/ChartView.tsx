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
  onUpsertTask: (data: Record<string, unknown>) => void;
  onUpsertKdi: (data: Record<string, unknown>) => void;
  onDeleteKdi: (id: string) => void;
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
const FONT_SERIF = "'Noto Serif JP', serif";
const FONT = FONT_SANS;

/* Notebook palette */
const C_PAPER = "#ffffff";
const C_PAPER_DEEP = "#f0ebe0";
const C_INK = "#2c2c2c";
const C_INK_SOFT = "#5c4a2a";
const C_BROWN = "#8b7355";
const C_BROWN_SOFT = "#c9b99a";
const C_BG = "#faf8f3";
const C_GOLD = "#d4a853";
const C_SUCCESS_BG = "#f0f7ee";
const C_DANGER_BG = "#fdf0f0";
const C_WARN_BG = "#fdf8ee";

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
  const min = isCenter ? 8 : 7;

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
      !isCenter &&
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
          lineHeight: 1.3,
          textAlign: "center",
          wordBreak: "keep-all",
          overflowWrap: "break-word",
          whiteSpace: "normal",
          fontFamily: isTheme || isSgCenter ? FONT_SERIF : FONT_SANS,
          color: isTheme ? C_BG : "inherit",
          fontWeight: isTheme ? 600 : isSgCenter ? 600 : isCenter ? 500 : 400,
          letterSpacing: isTheme || isSgCenter ? "0.02em" : "normal",
          ...(truncated
            ? {
                display: "-webkit-box",
                WebkitLineClamp: 2,
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
  const now = new Date();
  const kdiChecks = checks.filter((c) => c.kdi_id === kdi.id);
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
}: {
  cells: CellData[];
  kdis: Kdi[];
  checks: KdiCheck[];
  onCellClick: (cell: CellData) => void;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(9, 1fr)",
        gridTemplateRows: "repeat(9, 1fr)",
        border: `2px solid ${C_BROWN}`,
        background: C_BG,
        aspectRatio: "27 / 18",  /* 9 cols × 3 : 9 rows × 2 = 3:2 per cell */
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      {cells.map((cell, i) => {
        const { badge, bg } = getCellBadgeAndBg(cell, kdis, checks);
        const style = getCellStyle(cell, bg);
        const restoreBg = style.background as string;
        const isSgCenter =
          (!cell.isCenterBlock && cell.isCenter) ||
          (cell.isCenterBlock && !cell.isThemeCenter);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onCellClick(cell)}
            onMouseEnter={(e) => {
              if (!cell.isThemeCenter)
                e.currentTarget.style.background = "#f5f0e3";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = restoreBg;
            }}
            style={style}
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
    </div>
  );
}

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
  onUpsertTask,
  onUpsertKdi,
  onDeleteKdi,
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
    freq: "daily" as "daily" | "weekly",
    target_per_month: 4,
    threshold: 90,
    deadline: "",
  });

  const [fullscreen, setFullscreen] = useState(false);

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
        kdiForm.freq === "weekly" ? kdiForm.target_per_month : null,
      threshold: kdiForm.threshold,
      deadline: kdiForm.deadline || null,
    });
    setShowKdiForm(false);
  }, [editingTask, kdiForm, taskForm.label, onUpsertKdi]);

  const handleDeleteChart = useCallback(() => {
    onDeleteChart(selectedChartId);
    setShowDeleteConfirm(false);
    setSelectedChartId("");
  }, [selectedChartId, onDeleteChart]);

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
          <MandalaGrid cells={cells} kdis={kdis} checks={checks} onCellClick={handleCellClick} />
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
              <MandalaGrid cells={cells} kdis={kdis} checks={checks} onCellClick={handleCellClick} />
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
          <input type="text" value={themeLabel} onChange={(e) => setThemeLabel(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" autoFocus />
          <Button className="w-full" disabled={!themeLabel.trim()} onClick={saveTheme}>保存</Button>
        </div>
      </Modal>

      {/* ===== Sub-Goal Edit ===== */}
      <Modal open={!!editingSg} onClose={() => setEditingSg(null)} title="サブ目標の編集">
        {editingSg && (
          <div className="space-y-4">
            <input type="text" value={sgLabel} onChange={(e) => setSgLabel(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" autoFocus />
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
              <input
                type="text"
                value={taskForm.label}
                onChange={(e) => setTaskForm((f) => ({ ...f, label: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"
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
                          <p className="text-sm truncate">{kdi.label}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              kdi.freq === "daily" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                            }`}>
                              {kdi.freq === "daily" ? "デイリー" : "ウィークリー"}
                            </span>
                            <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              rate >= 80 ? "bg-green-100 text-green-700" : rate >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                            }`}>
                              実行率 {rate}%
                            </span>
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
              <div className="flex gap-2">
                {(["daily", "weekly"] as const).map((f) => (
                  <button key={f} onClick={() => setKdiForm((fm) => ({ ...fm, freq: f }))}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm transition ${kdiForm.freq === f ? "border-primary bg-primary/10 font-medium" : "bg-card"}`}>
                    {f === "daily" ? "デイリー" : "ウィークリー"}
                  </button>
                ))}
              </div>
            </div>
            {kdiForm.freq === "weekly" && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">月間目標回数</label>
                <input type="number" value={kdiForm.target_per_month}
                  onChange={(e) => setKdiForm((f) => ({ ...f, target_per_month: parseInt(e.target.value) || 4 }))}
                  className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
              </div>
            )}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">達成閾値（%）</label>
              <input type="number" value={kdiForm.threshold}
                onChange={(e) => setKdiForm((f) => ({ ...f, threshold: parseInt(e.target.value) || 90 }))}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">期日</label>
              <input type="date" value={kdiForm.deadline}
                onChange={(e) => setKdiForm((f) => ({ ...f, deadline: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
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
    </div>
  );
}
