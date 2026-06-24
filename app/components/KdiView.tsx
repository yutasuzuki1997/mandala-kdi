"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";
import type { Chart, Kdi } from "@/app/types";

type Freq = Kdi["freq"];

export interface SplitOpts {
  baseLabel: string;
  year: number;
  startMonth: number;
  endMonth: number;
  perMonth: number;
}

const FREQ_LABEL: Record<Freq, string> = {
  daily: "デイリー",
  weekly: "ウィークリー",
  monthly: "マンスリー",
  once: "達成型",
};

const FREQ_BADGE: Record<Freq, string> = {
  daily: "bg-blue-100 text-blue-700",
  weekly: "bg-purple-100 text-purple-700",
  monthly: "bg-emerald-100 text-emerald-700",
  once: "bg-amber-100 text-amber-700",
};

interface Props {
  kdis: Kdi[];
  charts: Chart[];
  onUpsertKdi: (data: Record<string, unknown>) => void;
  onDeleteKdi: (id: string) => void;
  onUpdateKdiDates: (
    id: string,
    patch: { start_date?: string | null; deadline?: string | null }
  ) => void;
  onSplitKdi: (
    kdi: { id: string; task_id: string; threshold: number },
    opts: SplitOpts
  ) => void;
}

export default function KdiView({
  kdis,
  charts,
  onUpsertKdi,
  onDeleteKdi,
  onUpdateKdiDates,
  onSplitKdi,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Kdi | null>(null);
  const [newStart, setNewStart] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [splitTarget, setSplitTarget] = useState<Kdi | null>(null);
  const [addForm, setAddForm] = useState({
    label: "",
    freq: "daily" as Freq,
    target_per_month: 4,
    threshold: 90,
    start_date: "",
    deadline: "",
  });

  const grouped = useMemo(() => {
    return {
      daily: kdis.filter((k) => k.freq === "daily"),
      weekly: kdis.filter((k) => k.freq === "weekly"),
      monthly: kdis.filter((k) => k.freq === "monthly"),
      once: kdis.filter((k) => k.freq === "once"),
    };
  }, [kdis]);

  const openSplit = (kdi: Kdi) => setSplitTarget(kdi);
  const openReschedule = (kdi: Kdi) => {
    setRescheduleTarget(kdi);
    setNewStart(kdi.start_date ?? "");
    setNewDeadline(kdi.deadline ?? "");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">KDI一覧</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          + 追加
        </Button>
      </div>

      {(["daily", "weekly", "monthly", "once"] as const).map((f) =>
        grouped[f].length > 0 ? (
          <section key={f}>
            <h3 className="mb-2 text-xs font-medium text-muted-foreground">
              {FREQ_LABEL[f]}（{grouped[f].length}）
            </h3>
            <div className="space-y-2">
              {grouped[f].map((kdi) => (
                <KdiCard
                  key={kdi.id}
                  kdi={kdi}
                  onDelete={() => onDeleteKdi(kdi.id)}
                  onReschedule={() => openReschedule(kdi)}
                  onSplit={() => openSplit(kdi)}
                />
              ))}
            </div>
          </section>
        ) : null
      )}

      {kdis.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          KDIがありません。チャートのタスクからKDIを設定するか、手動で追加してください。
        </p>
      )}

      {/* Add KDI Modal */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="KDIを追加"
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">名前</label>
            <input
              type="text"
              value={addForm.label}
              onChange={(e) =>
                setAddForm((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="毎朝10分読書"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">頻度</label>
            <div className="grid grid-cols-2 gap-2">
              {(["daily", "weekly", "monthly", "once"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAddForm((form) => ({ ...form, freq: f }))}
                  className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                    addForm.freq === f
                      ? "border-primary bg-primary/10 font-medium"
                      : "bg-card"
                  }`}
                >
                  {FREQ_LABEL[f]}
                </button>
              ))}
            </div>
          </div>
          {(addForm.freq === "weekly" || addForm.freq === "monthly") && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                月間目標回数
              </label>
              <input
                type="number"
                value={addForm.target_per_month}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    target_per_month: parseInt(e.target.value) || 4,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          {addForm.freq !== "once" && (
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
                達成閾値（%）
              </label>
              <input
                type="number"
                value={addForm.threshold}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    threshold: parseInt(e.target.value) || 90,
                  }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">開始日</label>
              <input
                type="date"
                value={addForm.start_date}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, start_date: e.target.value }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">期日</label>
              <input
                type="date"
                value={addForm.deadline}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, deadline: e.target.value }))
                }
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!addForm.label.trim()}
            onClick={() => {
              onUpsertKdi({
                label: addForm.label,
                freq: addForm.freq,
                target_per_month:
                  addForm.freq === "weekly" || addForm.freq === "monthly"
                    ? addForm.target_per_month
                    : null,
                threshold: addForm.freq === "once" ? 100 : addForm.threshold,
                start_date: addForm.start_date || null,
                deadline: addForm.deadline || null,
              });
              setAddForm({
                label: "",
                freq: "daily",
                target_per_month: 4,
                threshold: 90,
                start_date: "",
                deadline: "",
              });
              setShowAdd(false);
            }}
          >
            追加
          </Button>
        </div>
      </Modal>

      {/* Date settings Modal (start + deadline) */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="日程の設定"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {rescheduleTarget?.label}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">開始日</label>
              <input
                type="date"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">期日</label>
              <input
                type="date"
                value={newDeadline}
                onChange={(e) => setNewDeadline(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRescheduleTarget(null)}
            >
              キャンセル
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (rescheduleTarget) {
                  onUpdateKdiDates(rescheduleTarget.id, {
                    start_date: newStart || null,
                    deadline: newDeadline || null,
                  });
                }
                setRescheduleTarget(null);
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>

      {/* Split Modal */}
      <SplitModal
        kdi={splitTarget}
        onClose={() => setSplitTarget(null)}
        onSplit={onSplitKdi}
      />
    </div>
  );
}

function stripPeriodSuffix(label: string): string {
  // Drop a trailing "（…）" annotation like "×12回（月2回・7-12月）" for a clean base name.
  return label.replace(/[（(][^（）()]*[）)]\s*$/, "").trim() || label;
}

function SplitModal({
  kdi,
  onClose,
  onSplit,
}: {
  kdi: Kdi | null;
  onClose: () => void;
  onSplit: Props["onSplitKdi"];
}) {
  const [form, setForm] = useState({
    baseLabel: "",
    year: 2026,
    startMonth: 7,
    endMonth: 12,
    perMonth: 2,
  });

  // Re-seed the form each time a new target opens; clear when the modal closes
  // so reopening the same KDI starts fresh.
  const [seeded, setSeeded] = useState("");
  if (!kdi && seeded !== "") {
    setSeeded("");
  } else if (kdi && seeded !== kdi.id) {
    setSeeded(kdi.id);
    setForm({
      baseLabel: stripPeriodSuffix(kdi.label),
      year: kdi.deadline ? Number(kdi.deadline.slice(0, 4)) || 2026 : 2026,
      startMonth: 7,
      endMonth: 12,
      perMonth: kdi.target_per_month ?? 2,
    });
  }

  const months =
    form.endMonth >= form.startMonth
      ? form.endMonth - form.startMonth + 1
      : 0;
  const total = months * form.perMonth;

  return (
    <Modal open={!!kdi} onClose={onClose} title="マンスリーKDIに分割">
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          期間を指定して、月ごとのマンスリーKDIに分割します。元のKDIは削除されます。
        </p>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">ベース名</label>
          <input
            type="text"
            value={form.baseLabel}
            onChange={(e) => setForm((f) => ({ ...f, baseLabel: e.target.value }))}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">年</label>
            <input
              type="number"
              value={form.year}
              onChange={(e) =>
                setForm((f) => ({ ...f, year: parseInt(e.target.value) || f.year }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              月あたり回数
            </label>
            <input
              type="number"
              min={1}
              value={form.perMonth}
              onChange={(e) =>
                setForm((f) => ({ ...f, perMonth: parseInt(e.target.value) || 1 }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">開始月</label>
            <select
              value={form.startMonth}
              onChange={(e) =>
                setForm((f) => ({ ...f, startMonth: parseInt(e.target.value) }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">終了月</label>
            <select
              value={form.endMonth}
              onChange={(e) =>
                setForm((f) => ({ ...f, endMonth: parseInt(e.target.value) }))
              }
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m}月
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {months > 0
            ? `${months}件のマンスリーKDIを作成（合計 ${total}回・各月末が期日）`
            : "終了月は開始月以降にしてください"}
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            size="sm"
            disabled={!kdi || months <= 0 || !form.baseLabel.trim()}
            onClick={() => {
              if (!kdi || months <= 0) return;
              onSplit(
                { id: kdi.id, task_id: kdi.task_id, threshold: kdi.threshold },
                {
                  baseLabel: form.baseLabel.trim(),
                  year: form.year,
                  startMonth: form.startMonth,
                  endMonth: form.endMonth,
                  perMonth: form.perMonth,
                }
              );
              onClose();
            }}
          >
            分割する
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function KdiCard({
  kdi,
  onDelete,
  onReschedule,
  onSplit,
}: {
  kdi: Kdi;
  onDelete: () => void;
  onReschedule: () => void;
  onSplit: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{kdi.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-medium ${FREQ_BADGE[kdi.freq]}`}
          >
            {FREQ_LABEL[kdi.freq]}
          </span>
          {(kdi.start_date || kdi.deadline) && (
            <span className="text-[11px] text-muted-foreground">
              {kdi.start_date ?? ""}〜{kdi.deadline ?? ""}
            </span>
          )}
          {kdi.task && (
            <span className="text-[11px] text-muted-foreground">
              ← {(kdi.task as any).label}
            </span>
          )}
        </div>
      </div>
      {kdi.freq !== "monthly" && (
        <Button size="icon-xs" variant="ghost" onClick={onSplit} title="マンスリーに分割">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 12h6m6 0h6" />
            <circle cx="12" cy="5" r="2" />
            <circle cx="12" cy="19" r="2" />
            <path d="M12 7v3m0 4v3" />
          </svg>
        </Button>
      )}
      <Button size="icon-xs" variant="ghost" onClick={onReschedule}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </Button>
      <Button size="icon-xs" variant="destructive" onClick={onDelete}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-2 14H7L5 6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        </svg>
      </Button>
    </div>
  );
}
