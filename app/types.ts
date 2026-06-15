export interface Chart {
  id: string;
  user_id: string;
  name: string;
  theme: string;
  created_at: string;
  updated_at: string;
}

export interface SubGoal {
  id: string;
  chart_id: string;
  position: number;
  label: string;
}

export interface Task {
  id: string;
  sub_goal_id: string;
  position: number;
  label: string;
  type: "achieve" | "habit";
  deadline: string | null;
  status: "active" | "done";
  habit_confirmed_month: string | null;
}

export interface Kdi {
  id: string;
  task_id: string;
  user_id: string;
  label: string;
  freq: "daily" | "weekly" | "once";
  target_per_month: number | null;
  threshold: number;
  deadline: string | null;
  created_at: string;
  task?: Task;
}

export interface KdiCheck {
  id: string;
  kdi_id: string;
  checked_date: string;
}

export interface FullChart extends Chart {
  sub_goals: (SubGoal & { tasks: Task[] })[];
}
