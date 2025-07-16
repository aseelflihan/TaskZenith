// D:\applications\tasks\final\TaskZenith\src\types\quick-task.d.ts

/**
 * Represents a single, individual task item.
 */
export interface QuickTask {
  id: string;          // Unique identifier for the task
  text: string;        // The content of the task
  completed: boolean;  // The completion status
  order: number;       // The numerical order of the task within its group
  color?: string;      // Optional color tag for the task
}

/**
 * Represents a group that contains multiple tasks.
 * This is the new top-level structure.
 */
export interface TaskGroup {
  id: string;          // Unique identifier for the group
  title: string;       // The title of the group (e.g., "Work", "Home")
  tasks: QuickTask[];  // An array of tasks belonging to this group
}