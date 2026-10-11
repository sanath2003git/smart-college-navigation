/**
 * eventService.js
 *
 * Data access and management service for SmartNav Events.
 *
 * Current implementation uses browser localStorage with namespaced keys and
 * dynamic demonstration seeding. Designed to be cleanly replaced by or connected
 * to the Django REST API (/api/events/) in Phase 5 without refactoring UI components.
 */

import { seedEvents } from "../data/seedEvents.js";
import { CAMPUS_VENUES, getVenues, getVenueById } from "../data/campusVenues.js";
import { getStatus } from "../utils/eventTime.js";

// ── Storage Keys (Namespaced to SmartNav) ──────────────────────────
export const STORAGE_KEYS = {
  EVENTS: "smartnav_events",
  SAVED: "smartnav_saved_events",
  SEED_TIMESTAMP: "smartnav_events_seed_ts",
};

// Re-seed demo data if stored seed is older than 4 hours so Live/Today status stays fresh
const STALE_SEED_MAX_AGE_MS = 4 * 60 * 60 * 1000;

// ── In-Memory Fallback Cache (for environments without localStorage) ─
const memoryStore = {
  [STORAGE_KEYS.EVENTS]: null,
  [STORAGE_KEYS.SAVED]: [],
  [STORAGE_KEYS.SEED_TIMESTAMP]: null,
};

function readStorage(key, fallback = null) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const raw = window.localStorage.getItem(key);
      if (raw === null || raw === undefined) return fallback;
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[eventService] Failed to read ${key} from localStorage:`, err);
  }
  return memoryStore[key] ?? fallback;
}

function writeStorage(key, value) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch (err) {
    console.warn(`[eventService] Failed to write ${key} to localStorage:`, err);
  }
  memoryStore[key] = value;
}

function removeStorage(key) {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch (err) {
    console.warn(`[eventService] Failed to remove ${key} from localStorage:`, err);
  }
  delete memoryStore[key];
}

// ── Bootstrap & Demo Data Seeding ──────────────────────────────────
/**
 * Ensures demo events are populated in storage and not stale.
 */
function ensureSeeded() {
  const seedTimestamp = readStorage(STORAGE_KEYS.SEED_TIMESTAMP, null);
  const existingEvents = readStorage(STORAGE_KEYS.EVENTS, null);

  const isStale =
    !seedTimestamp ||
    Date.now() - Number(seedTimestamp) > STALE_SEED_MAX_AGE_MS;

  const isMissing =
    !Array.isArray(existingEvents) || existingEvents.length === 0;

  if (isStale || isMissing) {
    const initialEvents = seedEvents();
    writeStorage(STORAGE_KEYS.EVENTS, initialEvents);
    writeStorage(STORAGE_KEYS.SEED_TIMESTAMP, Date.now());

    // Keep existing saved IDs if valid, otherwise initialize empty
    const saved = readStorage(STORAGE_KEYS.SAVED, null);
    if (!Array.isArray(saved)) {
      writeStorage(STORAGE_KEYS.SAVED, []);
    }
  }
}

// ── Public Service Interface ───────────────────────────────────────

/**
 * Retrieves all events, ensuring storage is populated.
 *
 * @returns {Array<Object>} List of all events.
 */
export function getEvents() {
  ensureSeeded();
  const events = readStorage(STORAGE_KEYS.EVENTS, []);
  return Array.isArray(events) ? events : [];
}

/**
 * Retrieves a single event by ID.
 *
 * @param {string} id - Event ID.
 * @returns {Object|null} The event object or null if not found.
 */
export function getEventById(id) {
  if (!id) return null;
  const events = getEvents();
  return events.find((e) => e.id === id) || null;
}

/**
 * Adds a new event to storage.
 *
 * @param {Object} eventData - Event data object.
 * @returns {Object} The created event with generated ID and timestamp.
 */
export function createEvent(eventData) {
  if (!eventData || typeof eventData !== "object") {
    throw new Error("Invalid event data.");
  }

  if (!eventData.title || !eventData.title.trim()) {
    throw new Error("Event title is required.");
  }

  if (!eventData.venueId || !getVenueById(eventData.venueId)) {
    throw new Error(`Invalid venue ID: ${eventData.venueId}`);
  }

  const start =
    typeof eventData.start === "number"
      ? eventData.start
      : new Date(eventData.start).getTime();

  const end =
    typeof eventData.end === "number"
      ? eventData.end
      : new Date(eventData.end).getTime();

  if (isNaN(start) || isNaN(end) || start > end) {
    throw new Error("Invalid start or end datetime.");
  }

  const newEvent = {
    id:
      eventData.id ||
      `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: eventData.title.trim(),
    category: eventData.category || "Other",
    venueId: eventData.venueId,
    start,
    end,
    organizer: (eventData.organizer || "Campus Organizer").trim(),
    description: (eventData.description || "").trim(),
    isDemo: Boolean(eventData.isDemo),
    createdAt: Date.now(),
  };

  const events = getEvents();
  events.push(newEvent);
  writeStorage(STORAGE_KEYS.EVENTS, events);

  return newEvent;
}

/**
 * Updates an existing event by ID.
 *
 * @param {string} id - Event ID to update.
 * @param {Object} updates - Updated fields.
 * @returns {Object|null} The updated event or null if not found.
 */
export function updateEvent(id, updates) {
  if (!id) return null;
  const events = getEvents();
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const current = events[index];
  const updated = {
    ...current,
    ...updates,
    id: current.id, // Preserve original ID
    updatedAt: Date.now(),
  };

  events[index] = updated;
  writeStorage(STORAGE_KEYS.EVENTS, events);
  return updated;
}

/**
 * Deletes an event by ID.
 *
 * @param {string} id - Event ID.
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteEvent(id) {
  if (!id) return false;
  const events = getEvents();
  const initialLength = events.length;
  const filtered = events.filter((e) => e.id !== id);

  if (filtered.length !== initialLength) {
    writeStorage(STORAGE_KEYS.EVENTS, filtered);
    // Also remove from saved list if present
    const saved = getSavedEventIds();
    if (saved.includes(id)) {
      writeStorage(
        STORAGE_KEYS.SAVED,
        saved.filter((savedId) => savedId !== id)
      );
    }
    return true;
  }
  return false;
}

/**
 * Returns array of saved event IDs.
 *
 * @returns {Array<string>} Array of event IDs.
 */
export function getSavedEventIds() {
  ensureSeeded();
  const saved = readStorage(STORAGE_KEYS.SAVED, []);
  return Array.isArray(saved) ? saved : [];
}

/**
 * Checks whether an event is currently saved.
 *
 * @param {string} id - Event ID.
 * @returns {boolean}
 */
export function isEventSaved(id) {
  if (!id) return false;
  const saved = getSavedEventIds();
  return saved.includes(id);
}

/**
 * Toggles the saved status of an event.
 *
 * @param {string} id - Event ID.
 * @returns {Array<string>} Updated array of saved event IDs.
 */
export function toggleSavedEvent(id) {
  if (!id) return getSavedEventIds();
  const saved = getSavedEventIds();
  const index = saved.indexOf(id);

  let updated;
  if (index === -1) {
    updated = [...saved, id];
  } else {
    updated = saved.filter((savedId) => savedId !== id);
  }

  writeStorage(STORAGE_KEYS.SAVED, updated);
  return updated;
}

/**
 * Returns full event objects for all saved event IDs.
 *
 * @returns {Array<Object>} List of saved events.
 */
export function getSavedEvents() {
  const savedIds = new Set(getSavedEventIds());
  const events = getEvents();
  return events.filter((e) => savedIds.has(e.id));
}

/**
 * Resets all events and saved states back to initial clean demo data.
 */
export function resetDemoEvents() {
  removeStorage(STORAGE_KEYS.EVENTS);
  removeStorage(STORAGE_KEYS.SAVED);
  removeStorage(STORAGE_KEYS.SEED_TIMESTAMP);
  ensureSeeded();
  return getEvents();
}

/**
 * Searches and filters events by query, category, and status.
 *
 * @param {Object} [options={}] - Filter criteria.
 * @param {string} [options.query=""] - Text search across title, organizer, description, venue.
 * @param {string} [options.category="All"] - Category filter.
 * @param {string} [options.status=null] - "live" | "today" | "upcoming" | "ended".
 * @param {number} [options.now=Date.now()] - Reference timestamp.
 * @returns {Array<Object>} Filtered events.
 */
export function searchEvents({
  query = "",
  category = "All",
  status = null,
  now = Date.now(),
} = {}) {
  const allEvents = getEvents();
  const q = (query || "").trim().toLowerCase();

  return allEvents.filter((event) => {
    // 1. Category filter
    if (category && category !== "All" && event.category !== category) {
      return false;
    }

    // 2. Status filter
    if (status) {
      const eventStatus = getStatus(event, now);
      if (eventStatus !== status) {
        return false;
      }
    }

    // 3. Search query filter
    if (q) {
      const venue = event.venueId ? getVenueById(event.venueId) : null;
      const titleMatch = Boolean(
        event.title && event.title.toLowerCase().includes(q)
      );
      const organizerMatch = Boolean(
        event.organizer && event.organizer.toLowerCase().includes(q)
      );
      const descMatch = Boolean(
        event.description && event.description.toLowerCase().includes(q)
      );
      const venueMatch = Boolean(
        venue &&
          (venue.name.toLowerCase().includes(q) ||
            (venue.building && venue.building.toLowerCase().includes(q)) ||
            (venue.roomNo && venue.roomNo.toLowerCase().includes(q)))
      );
      const categoryMatch = Boolean(
        event.category && event.category.toLowerCase().includes(q)
      );

      if (
        !titleMatch &&
        !organizerMatch &&
        !descMatch &&
        !venueMatch &&
        !categoryMatch
      ) {
        return false;
      }
    }

    return true;
  });
}

// Re-export venue functions for convenient consumption
export { getVenues, getVenueById, CAMPUS_VENUES };
