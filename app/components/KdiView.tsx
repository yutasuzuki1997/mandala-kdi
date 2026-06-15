"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";
import type { Chart, Kdi } from "@/app/types";

interface Props {
  kdis: Kdi[];
  charts: Chart[];
  onUpsertKdi: (data: Record<string, unknown>) => void;
  onDeleteKdi: (id: string) => void;
  onRescheduleKdi: (id: string, newDeadline: string) => void;
}

export default function KdiView({
  kdis,
  charts,
  onUpsertKdi,
  onDeleteKdi,
  onRescheduleKdi,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Kdi | null>(null);
  const [newDeadline, setNewDeadline] = useState("");
  const [addForm, setAddForm] = useState({
    label: "",
    freq: "daily" as "daily" | "weekly" | "once",
    target_per_month: 4,
    threshold: 90,
    deadline: "",
  });

  const grouped = useMemo(() => {
    return {
      daily: kdis.filter((k) => k.freq === "daily"),
      weekly: kdis.filter((k) => k.freq === "weekly"),
      once: kdis.filter((k) => k.freq === "once"),
    };
  }, [kdis]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">KDI一覧</h2>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          + 追加
        </Button>
      </div>

      {/* Daily */}
      {grouped.daily.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            デイリー（{grouped.daily.length}）
          </h3>
          <div className="space-y-2">
            {grouped.daily.map((kdi) => (
              <KdiCard
                key={kdi.id}
                kdi={kdi}
                onDelete={() => onDeleteKdi(kdi.id)}
                onReschedule={() => {
                  setRescheduleTarget(kdi);
                  setNewDeadline(kdi.deadline ?? "");
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Weekly */}
      {grouped.weekly.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            ウィークリー（{grouped.weekly.length}）
          </h3>
          <div className="space-y-2">
            {grouped.weekly.map((kdi) => (
              <KdiCard
                key={kdi.id}
                kdi={kdi}
                onDelete={() => onDeleteKdi(kdi.id)}
                onReschedule={() => {
                  setRescheduleTarget(kdi);
                  setNewDeadline(kdi.deadline ?? "");
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* Once (achievement-type) */}
      {grouped.once.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">
            達成型（{grouped.once.length}）
          </h3>
          <div className="space-y-2">
            {grouped.once.map((kdi) => (
              <KdiCard
                key={kdi.id}
                kdi={kdi}
                onDelete={() => onDeleteKdi(kdi.id)}
                onReschedule={() => {
                  setRescheduleTarget(kdi);
                  setNewDeadline(kdi.deadline ?? "");
                }}
              />
            ))}
          </div>
        </section>
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
            <div className="flex gap-2">
              {(["daily", "weekly", "once"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setAddForm((form) => ({ ...form, freq: f }))}
                  className={`flex-1 rounded-lg border px-3 py-1.5 text-sm transition ${
                    addForm.freq === f
                      ? "border-primary bg-primary/10 font-medium"
                      : "bg-card"
                  }`}
                >
                  {f === "daily" ? "デイリー" : f === "weekly" ? "ウィークリー" : "達成型"}
                </button>
              ))}
            </div>
          </div>
          {addForm.freq === "weekly" && (
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
          <Button
            className="w-full"
            disabled={!addForm.label.trim()}
            onClick={() => {
              onUpsertKdi({
                label: addForm.label,
                freq: addForm.freq,
                target_per_month:
                  addForm.freq === "weekly" ? addForm.target_per_month : null,
                threshold: addForm.freq === "once" ? 100 : addForm.threshold,
                deadline: addForm.deadline || null,
              });
              setAddForm({
                label: "",
                freq: "daily",
                target_per_month: 4,
                threshold: 90,
                deadline: "",
              });
              setShowAdd(false);
            }}
          >
            追加
          </Button>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        title="期日の再設定"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {rescheduleTarget?.label}
          </p>
          <input
            type="date"
            value={newDeadline}
            onChange={(e) => setNewDeadline(e.target.value)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
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
                if (rescheduleTarget && newDeadline) {
                  onRescheduleKdi(rescheduleTarget.id, newDeadline);
                }
                setRescheduleTarget(null);
              }}
            >
              保存
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function KdiCard({
  kdi,
  onDelete,
  onReschedule,
}: {
  kdi: Kdi;
  onDelete: () => void;
  onReschedule: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{kdi.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
              kdi.freq === "daily"
                ? "bg-blue-100 text-blue-700"
                : kdi.freq === "weekly"
                ? "bg-purple-100 text-purple-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {kdi.freq === "daily" ? "デイリー" : kdi.freq === "weekly" ? "ウィークリー" : "達成型"}
          </span>
          {kdi.deadline && (
            <span className="text-[10px] text-muted-foreground">
              〜{kdi.deadline}
            </span>
          )}
          {kdi.task && (
            <span className="text-[10px] text-muted-foreground">
              ← {(kdi.task as any).label}
            </span>
          )}
        </div>
      </div>
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
