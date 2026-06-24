"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "./Modal";
import type { Kdi, Task, FullChart } from "@/app/types";

interface Props {
  charts: FullChart[];
  kdis: Kdi[];
  onCompleteTask: (taskId: string) => void;
  onRescheduleTask: (taskId: string, newDeadline: string) => void;
  onRescheduleKdi: (kdiId: string, newDeadline: string) => void;
}

interface TimelineItem {
  id: string;
  kind: "task" | "kdi";
  label: string;
  deadline: string;
  status?: string;
  type?: string;
  kdiFreq?: string;
}

function groupByMonth(items: TimelineItem[]) {
  const groups: Record<string, TimelineItem[]> = {};
  for (const item of items) {
    const month = item.deadline.slice(0, 7);
    if (!groups[month]) groups[month] = [];
    groups[month].push(item);
  }
  return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
}

function dotColor(item: TimelineItem): string {
  if (item.kind === "task") {
    if (item.status === "done") return "bg-green-500";
    if (item.type === "habit") return "bg-purple-500";
    const today = new Date().toISOString().slice(0, 10);
    if (item.deadline < today) return "bg-red-500";
  }
  return "bg-blue-500";
}

export default function TimelineView({
  charts,
  kdis,
  onCompleteTask,
  onRescheduleTask,
  onRescheduleKdi,
}: Props) {
  const [rescheduleTarget, setRescheduleTarget] = useState<TimelineItem | null>(null);
  const [newDeadline, setNewDeadline] = useState("");

  const nowMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const items = useMemo(() => {
    const result: TimelineItem[] = [];

    for (const chart of charts) {
      if (!chart.sub_goals) continue;
      for (const sg of chart.sub_goals) {
        if (!sg.tasks) continue;
        for (const t of sg.tasks) {
          if (t.deadline) {
            result.push({
              id: t.id,
              kind: "task",
              label: t.label,
              deadline: t.deadline,
              status: t.status,
              type: t.type,
            });
          }
        }
      }
    }

    for (const k of kdis) {
      if (k.deadline) {
        result.push({
          id: k.id,
          kind: "kdi",
          label: k.label,
          deadline: k.deadline,
          kdiFreq: k.freq,
        });
      }
    }

    return result;
  }, [charts, kdis]);

  const groups = groupByMonth(items);

  function formatMonth(m: string) {
    const [y, mo] = m.split("-");
    return `${y}年${parseInt(mo)}月`;
  }

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-8">
          期日が設定されたタスク・KDIがありません
        </p>
      )}

      {groups.map(([month, monthItems]) => {
        const isCurrent = month === nowMonth;
        const isPast = month < nowMonth;
        return (
          <section
            key={month}
            className={isPast ? "opacity-50" : ""}
          >
            <h3 className="sticky top-0 z-10 mb-2 flex items-center gap-1.5 bg-background py-1 text-sm font-semibold">
              {isCurrent && <span>📍</span>}
              {formatMonth(month)}
            </h3>
            <div className="space-y-2">
              {monthItems.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="flex items-center gap-3 rounded-xl border bg-card p-3"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor(item)}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${item.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                      {item.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {item.deadline} ・{item.kind === "task" ? "タスク" : "KDI"}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {item.kind === "task" && item.status !== "done" && (
                      <Button
                        size="xs"
                        variant="default"
                        onClick={() => onCompleteTask(item.id)}
                      >
                        完了
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setRescheduleTarget(item);
                        setNewDeadline(item.deadline);
                      }}
                    >
                      再設定
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Reschedule modal */}
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
                if (!rescheduleTarget || !newDeadline) return;
                if (rescheduleTarget.kind === "task") {
                  onRescheduleTask(rescheduleTarget.id, newDeadline);
                } else {
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
