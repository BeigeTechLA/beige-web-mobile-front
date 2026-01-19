import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import imageCompression from "browser-image-compression";
import { PDFDocument } from 'pdf-lib';

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