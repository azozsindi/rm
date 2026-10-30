import { ShiftType } from '../types';

/**
 * Saudi Arabia Timezone Helper (UTC+3)
 * Arabia Standard Time (AST) does not observe Daylight Saving Time.
 */
export function getSaudiNow(): Date {
  const now = new Date();
  // Get UTC milliseconds + 3 hours in ms
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const saudiMs = utcMs + 3 * 3600 * 1000;
  return new Date(saudiMs);
}

/**
 * Formats a Date object or timestamp to Saudi date string (YYYY-MM-DD)
 */
export function formatSaudiDate(dateInput: Date | string | number = new Date()): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const saudiDate = new Date(utcMs + 3 * 3600 * 1000);
  
  const year = saudiDate.getUTCFullYear();
  const month = String(saudiDate.getUTCMonth() + 1).padStart(2, '0');
  const day = String(saudiDate.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date object or timestamp to Saudi time string (HH:mm:ss 12-hour or 24-hour)
 */
export function formatSaudiTime(dateInput: Date | string | number = new Date(), includeSeconds = true): string {
  const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
  const utcMs = d.getTime() + d.getTimezoneOffset() * 60000;
  const saudiDate = new Date(utcMs + 3 * 3600 * 1000);
  
  const hours = saudiDate.getUTCHours();
  const minutes = String(saudiDate.getUTCMinutes()).padStart(2, '0');
  const seconds = String(saudiDate.getUTCSeconds()).padStart(2, '0');
  
  const period = hours >= 12 ? 'م' : 'ص';
  const hours12 = hours % 12 || 12;
  
  if (includeSeconds) {
    return `${hours12}:${minutes}:${seconds} ${period}`;
  }
  return `${hours12}:${minutes} ${period}`;
}

export function formatSaudiDateTime(dateInput: Date | string | number = new Date()): string {
  return `${formatSaudiDate(dateInput)} ${formatSaudiTime(dateInput)}`;
}

/**
 * Automatically determine the shift based on Saudi Arabia hour:
 * - شفت المساء (Evening): 12:00 PM (12) to 12:00 AM (24/0) -> 12:00 to 23:59:59
 * - شفت الصباح (Morning): 12:00 AM (0) to 12:00 PM (12) -> 00:00 to 11:59:59
 */
export function getShiftForSaudiHour(saudiHours: number): ShiftType {
  // hours is 0 to 23
  if (saudiHours >= 12 && saudiHours < 24) {
    return 'evening';
  }
  return 'morning';
}

export function getCurrentSaudiShift(customDate?: Date): ShiftType {
  const saudi = customDate ? customDate : getSaudiNow();
  return getShiftForSaudiHour(saudi.getUTCHours());
}

export function getShiftNameInArabic(shift: ShiftType): string {
  if (shift === 'morning' || shift === 'hakim') {
    return 'شفت الصباح';
  }
  return 'شفت المساء';
}

export function getShiftShortName(shift: ShiftType): string {
  if (shift === 'morning' || shift === 'hakim') {
    return 'صباح';
  }
  return 'مساء';
}

/**
 * Format timestamp or ISO string to clean friendly Arabic date and time
 * Example: "2026-10-29T22:04:50.411Z" -> "29 أكتوبر · 10:04 م"
 */
export function formatFriendlyArabicDateTime(dateInput?: string | Date): string {
  if (!dateInput) return '—';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);
    const dateStr = formatSaudiDate(d);
    const timeStr = formatSaudiTime(d, false);
    return `${dateStr} · ${timeStr}`;
  } catch {
    return String(dateInput);
  }
}
