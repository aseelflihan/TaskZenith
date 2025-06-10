
export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
  durationMinutes?: number; // User input for work duration
  breakMinutes?: number;   // User input for break after this subtask
  deadline?: string; // User input: YYYY-MM-DD, for scheduling this subtask
  scheduledTime?: string; // User input: HH:mm, for scheduling this subtask
  scheduledStartTime?: string; // Derived: Full ISO date string for when this subtask is scheduled to start
  actualEndTime?: string;     // Full ISO date string for when this subtask actually ended (work or break)
}

export interface Task {
  id:string;
  text: string;
  subtasks: SubTask[];
  // durationMinutes: number; // Removed: Managed at subtask level
  // breakMinutes: number; // Removed: Managed at subtask level
  completed: boolean; // Will be true if all subtasks are completed
  createdAt: string; // ISO string for date
  priority?: 'high' | 'medium' | 'low'; // Priority for the main task itself
  // deadline?: string; // Removed: Managed at subtask level
  // scheduledStartTime?: string; // Removed: Managed at subtask level
  // actualEndTime?: string; // Removed: This will be implicitly the end time of the last subtask
}

export type TaskFilter = "all" | "active" | "completed";

export type TimerSessionType = 'work' | 'break';

// ActiveTimerTarget will now always refer to a subtask, as main tasks don't have their own timer.
export type ActiveTimerTarget =
  | { type: 'subtask'; data: SubTask; parentTask: Task };

