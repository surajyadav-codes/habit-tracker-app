// Centralized date helpers. Nothing in the app should hardcode a date —
// everything derives from `new Date()` (the device's current date/time)
// through these functions.

export const WEEKDAY_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const WEEKDAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTH_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/**
 * Local YYYY-MM-DD string for a Date — deliberately NOT using
 * `toISOString()`, since that converts to UTC first and can silently
 * shift the date by a day depending on the device's timezone (e.g. late
 * night in India is already "tomorrow" in UTC). This stays in local time,
 * which is what a habit tracker's "today" should mean.
 */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayDateKey(): string {
  return toDateKey(new Date());
}

/** Midnight (local time) of the Monday in the same week as `d`. */
export function getMonday(d: Date): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  date.setDate(date.getDate() + diff);
  return date;
}

/** The 7 calendar dates (Monday -> Sunday) of the week containing `d`. */
export function getWeekDates(d: Date = new Date()): Date[] {
  const monday = getMonday(d);
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    return day;
  });
}

/** e.g. "Friday, 19 June 2026" */
export function formatFullDate(d: Date = new Date()): string {
  return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

/** e.g. "19 Jun" */
function shortMonthDay(d: Date): string {
  return `${d.getDate()} ${MONTH_FULL[d.getMonth()].slice(0, 3)}`;
}

/** e.g. "16 – 22 Jun 2026" for the week containing `d`. */
export function formatWeekRangeLabel(d: Date = new Date()): string {
  const [start, end] = [getWeekDates(d)[0], getWeekDates(d)[6]];
  const startLabel =
    start.getMonth() === end.getMonth()
      ? `${start.getDate()}`
      : shortMonthDay(start);
  return `${startLabel} – ${shortMonthDay(end)}, ${end.getFullYear()}`;
}

/** e.g. "June 2026" */
export function formatMonthLabel(d: Date = new Date()): string {
  return `${MONTH_FULL[d.getMonth()]} ${d.getFullYear()}`;
}