import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDate(value: string) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export const formatISOToDateTime = (isoString: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);

  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const formattedDate = date.toLocaleDateString(undefined, dateOptions);
  const formattedTime = date.toLocaleTimeString(undefined, timeOptions);

  return `${formattedDate}, ${formattedTime}`;
};

export const calculateDuration = (startDateString: string, endDateString: string): string => {
  if (!startDateString || !endDateString) {
    return "";
  }

  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return "Invalid Date";
  }

  const diffInMilliseconds = Math.abs(endDate.getTime() - startDate.getTime());

  const totalMinutes = Math.floor(diffInMilliseconds / (1000 * 60));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  let durationString = '';

  if (hours > 0) {
    durationString += `${hours} hour${hours > 1 ? 's' : ''}`;
  }

  if (minutes > 0) {
    if (hours > 0) {
      durationString += ' ';
    }
    durationString += `${minutes} min${minutes > 1 ? 's' : ''}`;
  }

  if (durationString === '' && diffInMilliseconds > 0) {
    return "Less than 1 min";
  }

  return durationString.trim();
};

/**
 * Debounce function - delays execution until after wait period
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}