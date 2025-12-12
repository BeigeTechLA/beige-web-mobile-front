import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDate(value: string) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}
