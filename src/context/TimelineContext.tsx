// src/context/TimelineContext.tsx
// REVISED: Expanded to handle both creating and opening tasks for editing.
// Now holds handlers for both actions, provided by the page component.

"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

// Define the type for the creation function
type CreateTaskHandler = (startTime: Date, duration: number) => void;

// NEW: Define the type for the editing function. 
// It accepts a task object (we use 'any' for flexibility, the actual type is enforced in the components).
type OpenTaskHandler = (task: any) => void;

// Define the shape of the context data
interface TimelineContextType {
  // Create task functions
  createTaskFromTimeline: CreateTaskHandler;
  setCreateTaskHandler: (handler: CreateTaskHandler) => void;
  // NEW: Edit task functions
  openTaskForEditing: OpenTaskHandler;
  setOpenTaskHandler: (handler: OpenTaskHandler) => void;
}

// Create the context with default do-nothing functions
const TimelineContext = createContext<TimelineContextType>({
  createTaskFromTimeline: () => console.warn("Timeline context (create) used before provider"),
  setCreateTaskHandler: () => {},
  openTaskForEditing: () => console.warn("Timeline context (edit) used before provider"),
  setOpenTaskHandler: () => {},
});

// Create a provider component
export const TimelineProvider = ({ children }: { children: React.ReactNode }) => {
  // Handler for creating tasks
  const [createHandler, setCreateHandler] = useState<CreateTaskHandler>(() => () => {});
  
  // NEW: Handler for opening tasks for editing
  const [openHandler, setOpenHandler] = useState<OpenTaskHandler>(() => () => {});

  // --- Create Logic ---
  const createTaskFromTimeline = useCallback((startTime: Date, duration: number) => {
    createHandler(startTime, duration);
  }, [createHandler]);

  const setCreateTaskHandler = useCallback((newHandler: CreateTaskHandler) => {
    setCreateHandler(() => newHandler);
  }, []);

  // --- NEW: Edit Logic ---
  const openTaskForEditing = useCallback((task: any) => {
    openHandler(task);
  }, [openHandler]);

  const setOpenTaskHandler = useCallback((newHandler: OpenTaskHandler) => {
    setOpenHandler(() => newHandler);
  }, []);


  const value = {
    createTaskFromTimeline,
    setCreateTaskHandler,
    openTaskForEditing,
    setOpenTaskHandler,
  };

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
};

// Create a custom hook to use the context
export const useTimeline = () => {
  const context = useContext(TimelineContext);
  if (context === undefined) {
    throw new Error('useTimeline must be used within a TimelineProvider');
  }
  return context;
};