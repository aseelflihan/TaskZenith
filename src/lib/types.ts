// src/lib/types.ts
export interface SubTask {
  id?: string;                                // ← أصبح اختياريًا
  text: string;
  completed: boolean;
  durationMinutes?: number;
  breakMinutes?: number;
  deadline?: string;
  scheduledTime?: string;
  scheduledStartTime?: string;
  actualEndTime?: string;
}

export interface Task {
  id: string;
  text: string;
  subtasks: SubTask[];
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
  priority?: 'high' | 'medium' | 'low';
}

export type TaskFilter = 'all' | 'active' | 'completed';
export type TimerSessionType = 'work' | 'break';

export type TaskPriority = 'high' | 'medium' | 'low';

export interface EnrichedSubTask extends SubTask {
  parentTaskText: string;
  parentTaskId: string;
  priority: TaskPriority;
  hasConflict?: boolean;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  tldr: string;
  summary: string;
  thumbnail: string;
  attribution?: string;
  source: string;
  tags: string[];
  tasks: { id: string; text: string; completed: boolean }[];
  originalContent: string;
  createdAt: string;
  userEmail: string;
}

export type ActiveTimerTarget =
  | { type: 'subtask'; data: SubTask; parentTask: Task };