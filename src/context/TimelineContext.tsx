// src/context/TimelineContext.tsx
// REVISED: Simplified the context to avoid timing issues.
// Now it directly holds the function provided by the page component.

"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

// Define the type for the creation function
type CreateTaskHandler = (startTime: Date, duration: number) => void;

// Define the shape of the context data
interface TimelineContextType {
  createTaskFromTimeline: CreateTaskHandler;
  setCreateTaskHandler: (handler: CreateTaskHandler) => void;
}

// Create the context with a default do-nothing function
const TimelineContext = createContext<TimelineContextType>({
  createTaskFromTimeline: () => console.warn("Timeline context used before provider"),
  setCreateTaskHandler: () => {},
});

// Create a provider component
export const TimelineProvider = ({ children }: { children: React.ReactNode }) => {
  const [handler, setHandler] = useState<CreateTaskHandler>(() => () => {});

  const createTaskFromTimeline = useCallback((startTime: Date, duration: number) => {
    handler(startTime, duration);
  }, [handler]);

  const setCreateTaskHandler = useCallback((newHandler: CreateTaskHandler) => {
    setHandler(() => newHandler);
  }, []);

  const value = {
    createTaskFromTimeline,
    setCreateTaskHandler,
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