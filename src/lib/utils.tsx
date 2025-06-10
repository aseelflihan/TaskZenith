
import * as React from 'react';
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parseISO, format as formatDateFn } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatTimelineTime = (isoString?: string): string | null => {
  if (!isoString) return null;
  try {
    const date = parseISO(isoString);
    return formatDateFn(date, "h:mm a"); // e.g., 5:30 PM
  } catch (e) {
    console.error("Error formatting date for timeline:", e, "Input:", isoString);
    return "Invalid Date";
  }
};

export const getTimelineDayNightIcon = (
  isoString?: string,
  SunIcon?: React.ComponentType<{ className?: string }>,
  MoonIcon?: React.ComponentType<{ className?: string }>
): React.ReactNode | null => {
  if (!isoString || !SunIcon || !MoonIcon) return null;
  try {
    const date = parseISO(isoString);
    const IconComponent = date.getHours() >= 6 && date.getHours() < 18 ? SunIcon : MoonIcon;
    return <IconComponent className="inline h-4 w-4 ml-1" />;
  } catch (e) {
    console.error("Error getting timeline icon:", e, "Input:", isoString);
    return null;
  }
};
