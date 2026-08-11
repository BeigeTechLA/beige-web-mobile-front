import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import imageCompression from "browser-image-compression";
import { PDFDocument } from 'pdf-lib';
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDate(value: string) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

const parseDateOnlyLocal = (value: string): Date | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return isNaN(date.getTime()) ? null : date;
};

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

export interface CompressionSettings {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}
/**
 * Compresses an image file for upload.
 * @param file The original File object from the user.
 * @param settings Optional overrides for size and dimensions.
 * @returns A promise resolving to the compressed File object.
 */
export async function compressImage(
  file: File,
  settings: CompressionSettings = {}
): Promise<File> {
  const options = {
    maxSizeMB: settings.maxSizeMB ?? 1,
    maxWidthOrHeight: settings.maxWidthOrHeight ?? 1920,
    useWebWorker: true,
    onIteration: (iteration: number) => console.log(`Compression iteration: ${iteration}`),
  };

  try {
    const compressedBlob = await imageCompression(file, options);

    // Convert Blob back to File to maintain metadata
    return new File([compressedBlob], file.name, {
      type: file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Fallback to original file if compression fails
  }
}

/**
 * Compresses a PDF by optimizing object streams and removing metadata.
 */
export async function compressPDF(file: File): Promise<File> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);

    const compressedBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false
    });

    const blobPart = new Uint8Array(compressedBytes);

    return new File([blobPart], file.name, { type: 'application/pdf' });
  } catch (error) {
    console.error("PDF compression failed, returning original file:", error);
    return file;
  }
}

export const isValidUrl = (urlString: string) => {
  try {
    new URL(urlString);
    return true;
  } catch (err) {
    return false;
  }
}

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")} minute(s)` : `${secs} second(s)`;
};

export const getFormattedDateString = (dates: Date[]) => {
  if (!dates.length) return "None";

  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());

  // Group dates by "Month, Year"
  const groups: Record<string, string[]> = {};

  sorted.forEach((date) => {
    const key = format(date, "MMMM, yyyy");
    const day = format(date, "d");
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(day);
  });

  // Format each group
  const formattedGroups = Object.entries(groups).map(([monthYear, days]) => {
    if (days.length === 1) {
      return `${days[0]} ${monthYear}`;
    }

    const lastDay = days.pop();
    const dayString = days.join(", ") + " & " + lastDay;
    return `${dayString} ${monthYear}`;
  });

  //Join different months with a semicolon or specific separator
  return formattedGroups.join("; ");
};

export const getInitials = (name: string) => {
  if (!name) return "NA";
  const words = name.trim().split(/\s+/);
  const firstLetter = words[0]?.charAt(0) || "";
  const secondLetter = words[1]?.charAt(0) || "";
  return (firstLetter + secondLetter).toUpperCase();
};

// Interfaces and Function to fetch date information for bookings
interface BookingDay {
  event_date: string;
  start_time: string;
  end_time: string;
  duration_hours: string;
  time_zone: string;
}

interface BookingData {
  event_date: string;
  start_time: string;
  end_time: string;
  booking_days: BookingDay[];
}

const formatBookingDisplayTime = (value?: string) => {
  if (!value) return "";

  const trimmed = value.trim();
  const meridiemMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s)?([AaPp][Mm])$/);
  if (meridiemMatch) {
    const hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const suffix = meridiemMatch[3].toUpperCase();

    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const normalizedHours =
        suffix === "PM" ? (hours % 12) + 12 : hours % 12;
      const date = new Date(2000, 0, 1, normalizedHours, minutes, 0, 0);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  const timeMatch =
    trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/) ||
    trimmed.match(/(?:T|\s)(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(?:Z)?$/);

  if (timeMatch) {
    const hours = Number(timeMatch[1]);
    const minutes = Number(timeMatch[2]);
    const seconds = Number(timeMatch[3] || 0);

    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      const date = new Date(2000, 0, 1, hours, minutes, Number.isNaN(seconds) ? 0 : seconds, 0);
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return trimmed;
};

export const getBookingDetails = (data: BookingData) => {
  const bookingDays: BookingDay[] = data.booking_days || [];

  // Sort by event_date
  const sortedBookingDays = [...bookingDays].sort((a, b) =>
    a.event_date.localeCompare(b.event_date)
  );

  const isMultiDay = sortedBookingDays.length > 0;
  const firstDay = sortedBookingDays[0];
  const lastDay = sortedBookingDays[sortedBookingDays.length - 1];

  // Grouping Logic for "Clubbed" Months
  const groups: { [key: string]: string[] } = {};
  sortedBookingDays.forEach((day) => {
    const parsedDate = parseDateOnlyLocal(day.event_date) ?? new Date(day.event_date);
    // Key format: "Apr, 2026"
    const monthYear = format(parsedDate, "MMM, yyyy");
    const dayNum = format(parsedDate, "dd");

    if (!groups[monthYear]) {
      groups[monthYear] = [];
    }
    groups[monthYear].push(dayNum);
  });

  const clubbedMonths = Object.entries(groups).map(([monthYear, days]) => {
    const dayRange = days.length > 1
      ? `${days[0]}-${days[days.length - 1]}`
      : days[0];
    return `${dayRange} ${monthYear}`;
  });

  const summaryDateText: string = isMultiDay
    ? `${sortedBookingDays.length} Days\n${clubbedMonths.join(" ;\n ")}`
    : data.event_date
      ? format(parseDateOnlyLocal(data.event_date) ?? new Date(data.event_date), "MMM dd, yyyy")
      : "Date not set";

  const allSameTime = isMultiDay && sortedBookingDays.every(
    (d) => d.start_time === firstDay?.start_time && d.end_time === firstDay?.end_time
  );

  const displayDateText: string = isMultiDay
    ? `${sortedBookingDays.length} days\n${format(parseDateOnlyLocal(firstDay.event_date) ?? new Date(firstDay.event_date), "EEE, MMM dd yyyy")} - ${format(parseDateOnlyLocal(lastDay.event_date) ?? new Date(lastDay.event_date), "EEE, MMM dd yyyy")}`
    : data.event_date
      ? format(parseDateOnlyLocal(data.event_date) ?? new Date(data.event_date), "EEEE, MMM dd yyyy")
      : "Date not set";


  const displayTimeText: string = isMultiDay
    ? (allSameTime && firstDay?.start_time && firstDay?.end_time
      ? `${formatBookingDisplayTime(firstDay.start_time)} - ${formatBookingDisplayTime(firstDay.end_time)}`
      : "Multiple times")
    : (data.start_time && data.end_time
      ? `${formatBookingDisplayTime(data.start_time)} - ${formatBookingDisplayTime(data.end_time)}`
      : "Time not set");

  return {
    isMultiDay,
    displayDateText,
    displayTimeText,
    summaryDateText,
    sortedBookingDays
  };
};

export const formatCurrency = (amount: number | string | null | undefined) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) {
    return "$0.00";
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
};

/**
 * Formats an ISO date string into "Today", "Tomorrow", or "MM/DD/YYYY".
 * * @param dateString - The ISO date string (e.g., "2026-04-21T12:43:27.000Z")
 * @returns A string representation: "Today", "Tomorrow", or absolute date in "MM/DD/YYYY"
 */
export const formatRelativeOrAbsoluteDate = (dateString: string): string => {
  if (!dateString) return "—";

  const inputDate = new Date(dateString);

  // Return original string if the date parsing fails
  if (isNaN(inputDate.getTime())) return dateString;

  // Get midnight today in local time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get midnight tomorrow in local time
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Normalize the input date to midnight local time for pure calendar day comparison
  const compareDate = new Date(inputDate);
  compareDate.setHours(0, 0, 0, 0);

  // 1. Check if the calendar date is Today
  if (compareDate.getTime() === today.getTime()) {
    return "Today";
  }

  // 2. Check if the calendar date is Tomorrow
  if (compareDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  }

  // 3. Fallback to MM/DD/YYYY format padding numbers with leading zeros
  const month = String(inputDate.getMonth() + 1).padStart(2, "0");
  const day = String(inputDate.getDate()).padStart(2, "0");
  const year = inputDate.getFullYear();

  return `${month}/${day}/${year}`;
};

/**
 * Evaluates a numeric parameter against two threshold boundaries (x and y)
 * and returns the corresponding color hex code.
 * * @param param - The number value to evaluate
 * @param x - The upper threshold boundary limit
 * @param y - The lower threshold boundary limit
 * @returns Color hex code string ('#10B981')
 */
export const getColorThreshold = (param: number, x: number, y: number): string => {
  // 1. Condition for > x
  if (param > x) {
    return "#10B981";
  }

  // 2. Condition for x >= param >= y
  if (param <= x && param >= y) {
    return "#FFC87B";
  }

  // 3. Condition for < y (Fallback catch-all execution boundary)
  return "#FF7B7B";
};

/**
 * Evaluates an ISO string or Date object and returns a hex color code based on its recency:
 * - Today or next 2 days: "#10B981" (Green)
 * - Between 3 and 7 days (exclusive of 7): "#FFC87B" (Yellow/Orange)
 * - 7 or more days into the future: "#91B8F9" (Blue)
 *
 * @param dateParam - The target date to evaluate (ISO string or Date object)
 * @returns Hex color code string
 */
export const getDateColorThreshold = (dateParam: string | Date): string => {
  if (!dateParam) return "#91B8F9"; // Fallback color if date is missing

  const targetDate = new Date(dateParam);
  if (isNaN(targetDate.getTime())) return "#91B8F9"; // Fallback if date is invalid

  // Normalize today's date to midnight local time
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  // Normalize target date to midnight local time to isolate pure calendar days
  const targetMidnight = new Date(targetDate);
  targetMidnight.setHours(0, 0, 0, 0);

  // Calculate the difference in milliseconds and convert to whole days
  const diffInMs = targetMidnight.getTime() - todayMidnight.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  // Condition 1: Today or within the next 2 days (Days: 0, 1, 2)
  if (diffInDays >= 0 && diffInDays <= 2) {
    return "#10B981";
  }

  // Condition 2: More than 2 days but fewer than 7 days (Days: 3, 4, 5, 6)
  if (diffInDays > 2 && diffInDays < 7) {
    return "#FFC87B";
  }

  // Condition 3: Greater than or equal to 7 days, or any past dates
  return "#91B8F9";
};

// Basic numeric formatter to convert numbers to 2 digit values
export const  formatter = new Intl.NumberFormat('en-US', { minimumIntegerDigits: 2 });
