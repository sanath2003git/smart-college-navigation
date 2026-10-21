/**
 * eventTime.js
 *
 * Real-time event status calculation, countdown formatting, and time utilities.
 *
 * Supports status lifecycles:
 * - "live"     → Current time is within [start, end)
 * - "today"    → Starts later on the same local calendar day
 * - "upcoming" → Starts on a future calendar day
 * - "ended"    → Current time is past event end
 * - "invalid"  → Missing or corrupted start/end timestamps
 */

/**
 * Computes the lifecycle display status of an event relative to a given timestamp.
 *
 * @param {Object} event - Event object with `start` and `end` timestamps (epoch ms).
 * @param {number} [now=Date.now()] - Current epoch ms timestamp.
 * @returns {"live" | "today" | "upcoming" | "ended" | "invalid"}
 */
export function getStatus(event, now = Date.now()) {
  if (
    !event ||
    typeof event.start !== "number" ||
    typeof event.end !== "number" ||
    isNaN(event.start) ||
    isNaN(event.end) ||
    event.start > event.end
  ) {
    return "invalid";
  }

  // 1. Live Now: current time is between event start and end
  if (now >= event.start && now < event.end) {
    return "live";
  }

  // 2. Ended: current time is at or beyond event end
  if (now >= event.end) {
    return "ended";
  }

  // 3. Starts in the future: check if it falls on the same local calendar day
  const startDate = new Date(event.start);
  const nowDate = new Date(now);

  const isSameDay =
    startDate.getFullYear() === nowDate.getFullYear() &&
    startDate.getMonth() === nowDate.getMonth() &&
    startDate.getDate() === nowDate.getDate();

  return isSameDay ? "today" : "upcoming";
}

/**
 * Formats duration milliseconds into human-readable string.
 *
 * Examples:
 * - 45s       → "less than a min"
 * - 45m       → "45 min"
 * - 2h 15m    → "2h 15min"
 * - 2h 0m     → "2h"
 * - 3d 4h     → "3d 4h"
 * - 3d 0h     → "3d"
 *
 * @param {number} ms - Duration in milliseconds (non-negative).
 * @returns {string}
 */
export function formatDuration(ms) {
  if (typeof ms !== "number" || isNaN(ms) || ms < 0) {
    return "0 min";
  }

  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  if (totalSeconds < 60) {
    return "less than a min";
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  }

  return `${minutes} min`;
}

/**
 * Returns a human-readable countdown or status description string.
 *
 * - Live:     "Ends in 45 min"
 * - Today:    "Starts in 2h 15min"
 * - Upcoming: "Starts in 2d 4h"
 * - Ended:    "Ended 30 min ago"
 *
 * @param {Object} event - Event object with `start` and `end`.
 * @param {number} [now=Date.now()] - Reference timestamp.
 * @returns {string}
 */
export function countdown(event, now = Date.now()) {
  const status = getStatus(event, now);

  if (status === "invalid") {
    return "";
  }

  if (status === "live") {
    return `Ends in ${formatDuration(event.end - now)}`;
  }

  if (status === "ended") {
    return `Ended ${formatDuration(now - event.end)} ago`;
  }

  // today or upcoming
  return `Starts in ${formatDuration(event.start - now)}`;
}

/**
 * Formats start and end epoch timestamps into a human-friendly date and time string.
 *
 * Examples:
 * - "Today · 2:00 PM – 4:30 PM"
 * - "Tomorrow · 10:00 AM – 1:00 PM"
 * - "Oct 15 · 9:30 AM – 12:00 PM"
 *
 * @param {number} start - Start epoch ms.
 * @param {number} end - End epoch ms.
 * @param {number} [now=Date.now()] - Reference epoch ms.
 * @returns {string}
 */
export function formatEventDateTime(start, end, now = Date.now()) {
  if (
    typeof start !== "number" ||
    typeof end !== "number" ||
    isNaN(start) ||
    isNaN(end)
  ) {
    return "--";
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  const nowDate = new Date(now);

  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const startDay = startDate.getDate();

  const nowYear = nowDate.getFullYear();
  const nowMonth = nowDate.getMonth();
  const nowDay = nowDate.getDate();

  // Tomorrow calculation
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow =
    startYear === tomorrow.getFullYear() &&
    startMonth === tomorrow.getMonth() &&
    startDay === tomorrow.getDate();

  // Yesterday calculation
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    startYear === yesterday.getFullYear() &&
    startMonth === yesterday.getMonth() &&
    startDay === yesterday.getDate();

  const isToday =
    startYear === nowYear &&
    startMonth === nowMonth &&
    startDay === nowDay;

  let datePrefix = startDate.toLocaleDateString([], {
    month: "short",
    day: "numeric",
  });

  if (isToday) datePrefix = "Today";
  else if (isTomorrow) datePrefix = "Tomorrow";
  else if (isYesterday) datePrefix = "Yesterday";

  const startTime = startDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  const endTime = endDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  return `${datePrefix} · ${startTime} – ${endTime}`;
}

/**
 * Status priority mapping for sorting feeds:
 * live (0) → today (1) → upcoming (2) → ended (3) → invalid (4)
 */
export function statusPriority(status) {
  switch (status) {
    case "live":
      return 0;
    case "today":
      return 1;
    case "upcoming":
      return 2;
    case "ended":
      return 3;
    default:
      return 4;
  }
}

/**
 * Sorts events according to standard feed priority:
 * 1. Live Now first (sorted by start time ascending)
 * 2. Today next (sorted by start time ascending)
 * 3. Upcoming next (sorted by start time ascending)
 * 4. Ended last (sorted by end time descending, most recently ended first)
 *
 * @param {Array<Object>} events - Array of event objects.
 * @param {number} [now=Date.now()] - Reference timestamp.
 * @returns {Array<Object>} Sorted shallow copy of events.
 */
export function sortEventsByStatus(events, now = Date.now()) {
  if (!Array.isArray(events)) return [];

  return [...events].sort((a, b) => {
    const statusA = getStatus(a, now);
    const statusB = getStatus(b, now);

    const prioA = statusPriority(statusA);
    const prioB = statusPriority(statusB);

    if (prioA !== prioB) {
      return prioA - prioB;
    }

    // Both ended: show most recently ended first
    if (statusA === "ended") {
      return (b.end ?? 0) - (a.end ?? 0);
    }

    // Otherwise show earlier start times first
    return (a.start ?? 0) - (b.start ?? 0);
  });
}

// Provides date and time utilities for campus events.