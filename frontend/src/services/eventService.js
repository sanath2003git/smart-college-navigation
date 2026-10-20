/**
 * eventService.js
 *
 * Data access and management service for SmartNav Events.
 *
 * Supports both:
 * 1. Live Django REST API integration (/api/events/, /api/venues/, /api/admin/events/)
 *    with Clerk JWT bearer authentication for admin CRUD.
 * 2. Seamless local fallback and client-side normalization ensuring existing
 *    public event browsing, bookmarks, and venue navigation continue to work smoothly.
 */

import { seedEvents } from "../data/seedEvents.js";
import { CAMPUS_VENUES, getVenues, getVenueById } from "../data/campusVenues.js";
import { getStatus } from "../utils/eventTime.js";

// ── API Configuration ──────────────────────────────────────────────
export const API_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  "http://127.0.0.1:8000";

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

// ── Normalization Helpers ──────────────────────────────────────────

/**
 * Normalizes a raw venue object from backend or local registry into the
 * canonical shape expected by both UI components and navigation services.
 *
 * @param {Object} v - Raw venue object
 * @returns {Object|null} Normalized venue object
 */
export function normalizeVenue(v) {
  if (!v || typeof v !== "object") return null;

  const lat =
    typeof v.lat === "number"
      ? v.lat
      : parseFloat(v.lat || v.coordinates?.lat || 0);

  const lng =
    typeof v.lng === "number"
      ? v.lng
      : parseFloat(v.lng || v.coordinates?.lng || 0);

  return {
    id: v.id,
    name: v.name || "Campus Venue",
    category: v.category || "Other",
    venueType: v.venue_type || v.venueType || "INDOOR_ROOM",
    building: v.building_name || v.building || null,
    floor:
      v.floor_number !== undefined && v.floor_number !== null
        ? v.floor_number
        : v.floor !== undefined && v.floor !== null
        ? v.floor
        : 0,
    roomNo: v.room_no || v.roomNo || null,
    coordinates: v.coordinates || { lat, lng },
    lat,
    lng,
    landmark: v.landmark || "",
    directions: v.directions || "",
    hasIndoorMap: Boolean(v.has_indoor_map ?? v.hasIndoorMap),
    isActive: v.is_active ?? v.isActive ?? true,
    buildingId: v.building_id || v.buildingId || null,
    roomId: v.room_id || v.roomId || null,
  };
}

/**
 * Normalizes a raw event object from Django REST Framework or local storage.
 * Guarantees epoch ms timestamps (`start`, `end`) for eventTime.js,
 * ISO strings (`startTime`, `endTime`) for form inputs,
 * normalized venue reference, and camelCase flags (`isDemo`, `venueId`).
 *
 * @param {Object} e - Raw event from backend or local storage
 * @param {Map<string, Object>} [venueMap=null] - Optional pre-fetched venue cache
 * @returns {Object|null}
 */
export function normalizeEvent(e, venueMap = null) {
  if (!e || typeof e !== "object") return null;

  // Resolve start/end timestamps (supports epoch numbers and ISO strings)
  const start =
    typeof e.start === "number" && !isNaN(e.start)
      ? e.start
      : e.start_time
      ? new Date(e.start_time).getTime()
      : Date.now();

  const end =
    typeof e.end === "number" && !isNaN(e.end)
      ? e.end
      : e.end_time
      ? new Date(e.end_time).getTime()
      : start + 3600000;

  // Resolve venue ID string
  const venueId =
    e.venue_id ||
    (typeof e.venue === "string" ? e.venue : e.venue?.id) ||
    e.venueId ||
    null;

  // Resolve venue object
  let venue = null;
  if (typeof e.venue === "object" && e.venue !== null) {
    venue = normalizeVenue(e.venue);
  } else if (venueId) {
    let rawVenue = null;
    if (venueMap instanceof Map) {
      rawVenue = venueMap.has(venueId) ? venueMap.get(venueId) : null;
    } else if (Array.isArray(venueMap)) {
      rawVenue = venueMap.find((v) => v?.id === venueId) || null;
    } else if (
      venueMap &&
      typeof venueMap === "object" &&
      typeof venueMap.has === "function" &&
      typeof venueMap.get === "function"
    ) {
      rawVenue = venueMap.has(venueId) ? venueMap.get(venueId) : null;
    } else if (
      venueMap &&
      typeof venueMap === "object" &&
      venueId in venueMap
    ) {
      rawVenue = venueMap[venueId] || null;
    }

    if (!rawVenue) {
      rawVenue = getVenueById(venueId);
    }

    if (rawVenue) {
      venue = normalizeVenue(rawVenue);
    }
  }

  return {
    id: e.id,
    title: e.title || "Untitled Event",
    category: e.category || "Other",
    venueId,
    venue,
    start,
    end,
    startTime: e.start_time || new Date(start).toISOString(),
    endTime: e.end_time || new Date(end).toISOString(),
    organizer: e.organizer || "Campus Organizer",
    description: e.description || "",
    isDemo: Boolean(e.is_demo ?? e.isDemo ?? false),
    createdByClerkId: e.created_by_clerk_id || null,
    createdAt: e.created_at
      ? new Date(e.created_at).getTime()
      : e.createdAt || Date.now(),
    updatedAt: e.updated_at
      ? new Date(e.updated_at).getTime()
      : e.updatedAt || Date.now(),
  };
}

/**
 * Translates client form inputs into the exact DRF AdminEventSerializer payload format.
 *
 * @param {Object} form - Form data from create/edit modal
 * @returns {Object} JSON payload for POST/PUT /api/admin/events/
 */
export function toApiEventPayload(form) {
  const payload = {
    title: form.title?.trim() || "",
    category: form.category || "Other",
    venue: form.venue || form.venueId || "",
    organizer: form.organizer?.trim() || "Campus Organizer",
    description: form.description?.trim() || "",
    is_demo: Boolean(form.is_demo ?? form.isDemo ?? false),
  };

  // Convert start time to ISO string
  if (form.start_time) {
    payload.start_time = new Date(form.start_time).toISOString();
  } else if (form.start) {
    payload.start_time = new Date(form.start).toISOString();
  }

  // Convert end time to ISO string
  if (form.end_time) {
    payload.end_time = new Date(form.end_time).toISOString();
  } else if (form.end) {
    payload.end_time = new Date(form.end).toISOString();
  }

  if (form.id) {
    payload.id = form.id;
  }

  return payload;
}

/**
 * Formats an epoch timestamp or ISO string into an HTML <input type="datetime-local"> value (YYYY-MM-DDTHH:mm).
 *
 * @param {number|string|Date} val
 * @returns {string} Formatted string in local time
 */
export function formatDatetimeLocal(val) {
  if (!val) return "";
  const d = val instanceof Date ? val : new Date(val);
  if (isNaN(d.getTime())) return "";

  const pad = (n) => String(n).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// ── Public API Functions ───────────────────────────────────────────

/**
 * Fetches public campus venues from GET /api/venues/?all=true.
 * Falls back to CAMPUS_VENUES if the backend is unreachable.
 *
 * @param {Object} [options={}]
 * @param {boolean} [options.all=true]
 * @returns {Promise<Array<Object>>} List of normalized venues
 */
export async function fetchPublicVenues({ all = true } = {}) {
  const url = new URL(`${API_BASE_URL}/api/venues/`);
  if (all) {
    url.searchParams.set("all", "true");
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      const rawList = Array.isArray(data)
        ? data
        : Array.isArray(data.results)
        ? data.results
        : [];
      return rawList.map(normalizeVenue).filter(Boolean);
    }
  } catch (err) {
    console.warn("[eventService] fetchPublicVenues falling back to static venues:", err);
  }

  // Fallback to verified static campus venues
  return CAMPUS_VENUES.map(normalizeVenue);
}

/**
 * Fetches public campus events from GET /api/events/.
 * Supports query parameters for category, status, search, and pagination.
 * Falls back to local seeded events if the backend is unreachable.
 *
 * @param {Object} [options={}]
 * @param {string} [options.query=""]
 * @param {string} [options.category="All"]
 * @param {string} [options.status=null] - "live" | "today" | "upcoming" | "ended"
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=50]
 * @param {boolean} [options.all=false]
 * @returns {Promise<{ results: Array<Object>, count: number, totalPages: number, currentPage: number, isFallback: boolean }>}
 */
export async function fetchPublicEvents({
  query = "",
  category = "All",
  status = null,
  page = 1,
  pageSize = 50,
  all = false,
} = {}) {
  const url = new URL(`${API_BASE_URL}/api/events/`);

  if (category && category !== "All") {
    url.searchParams.set("category", category);
  }
  if (status) {
    url.searchParams.set("status", status.toLowerCase());
  }
  if (query && query.trim()) {
    url.searchParams.set("search", query.trim());
  }
  if (all) {
    url.searchParams.set("all", "true");
  } else {
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(pageSize));
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        const normalized = data.map((e) => normalizeEvent(e)).filter(Boolean);
        return {
          results: normalized,
          count: normalized.length,
          totalPages: 1,
          currentPage: 1,
          isFallback: false,
        };
      }

      const normalized = (data.results || []).map((e) => normalizeEvent(e)).filter(Boolean);
      return {
        results: normalized,
        count: typeof data.count === "number" ? data.count : normalized.length,
        totalPages: data.total_pages || 1,
        currentPage: data.current_page || page,
        isFallback: false,
      };
    }
  } catch (err) {
    console.warn("[eventService] fetchPublicEvents falling back to local store:", err);
  }

  // Graceful fallback to searchEvents locally
  const localFiltered = searchEvents({ query, category, status });
  return {
    results: localFiltered.map((e) => normalizeEvent(e)),
    count: localFiltered.length,
    totalPages: 1,
    currentPage: 1,
    isFallback: true,
  };
}

// ── Protected Admin Token Helpers ──────────────────────────────────

/**
 * Decodes the payload portion of a JWT without signature verification (client-side inspect).
 * Safe against malformed base64 strings.
 *
 * @param {string} token - Raw JWT string
 * @returns {Object|null} Decoded JSON payload or null
 */
export function decodeJwtPayload(token) {
  if (typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Determines whether a JWT is expired or expiring within `bufferSeconds`.
 * Used to proactively refresh Clerk tokens before firing API requests.
 *
 * @param {string} token - Raw JWT string
 * @param {number} [bufferSeconds=10] - Safety margin in seconds
 * @returns {boolean} True if token is missing, expired, or expiring soon
 */
export function isJwtExpiringSoon(token, bufferSeconds = 10) {
  if (!token) return true;
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== "number") {
    return false; // If unparseable or lacks exp, let server validate
  }
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds + bufferSeconds;
}

/**
 * Resolves a fresh, valid Clerk JWT token.
 * If token is already expired or expiring within 10 seconds, instructs Clerk to bypass cache.
 *
 * @param {Function|string} tokenOrGetToken - Raw token string or Clerk's getToken() function
 * @param {Object} [options]
 * @param {boolean} [options.skipCache=false] - Explicitly force cache skip
 * @returns {Promise<string|null>}
 */
export async function getValidAdminToken(tokenOrGetToken, { skipCache = false } = {}) {
  if (!tokenOrGetToken) return null;

  if (typeof tokenOrGetToken === "function") {
    const getToken = tokenOrGetToken;
    let token = await getToken(skipCache ? { skipCache: true } : undefined);
    if (token && isJwtExpiringSoon(token, 10)) {
      // Cached token is expired or within the 10s buffer; force fresh mint from Clerk
      token = await getToken({ skipCache: true });
    }
    return token;
  }

  if (typeof tokenOrGetToken === "string") {
    return tokenOrGetToken;
  }

  return null;
}

// ── Protected Admin API Functions ──────────────────────────────────

/**
 * Fetches events list from the protected admin endpoint GET /api/admin/events/.
 * Supports auto-refreshing expired tokens and retrying idempotent GET once.
 *
 * @param {Object} params
 * @param {string} [params.token] - Raw Clerk JWT bearer token
 * @param {Function} [params.getToken] - Clerk session token getter
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=50]
 * @param {boolean} [params.all=false]
 * @param {boolean} [params._isRetry=false] - Internal flag preventing infinite retry loops
 * @returns {Promise<{ results: Array<Object>, count: number, totalPages: number, currentPage: number }>}
 */
export async function fetchAdminEvents({
  token,
  getToken,
  page = 1,
  pageSize = 50,
  all = false,
  _isRetry = false,
} = {}) {
  const authToken = token || (getToken ? await getValidAdminToken(getToken) : null);

  if (!authToken) {
    throw {
      status: 401,
      message: "Authentication token required. Please sign in.",
    };
  }

  const url = new URL(`${API_BASE_URL}/api/admin/events/`);
  if (all) {
    url.searchParams.set("all", "true");
  } else {
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(pageSize));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
  });

  if (res.status === 200) {
    const data = await res.json();
    if (Array.isArray(data)) {
      const normalized = data.map((e) => normalizeEvent(e)).filter(Boolean);
      return {
        results: normalized,
        count: normalized.length,
        totalPages: 1,
        currentPage: 1,
      };
    }

    const normalized = (data.results || []).map((e) => normalizeEvent(e)).filter(Boolean);
    return {
      results: normalized,
      count: typeof data.count === "number" ? data.count : normalized.length,
      totalPages: data.total_pages || 1,
      currentPage: data.current_page || page,
    };
  }

  // If 401 and we have getToken and haven't retried yet, force fresh token and retry once
  if (res.status === 401 && typeof getToken === "function" && !_isRetry) {
    try {
      const freshToken = await getToken({ skipCache: true });
      if (freshToken && freshToken !== authToken) {
        return await fetchAdminEvents({
          token: freshToken,
          getToken,
          page,
          pageSize,
          all,
          _isRetry: true,
        });
      }
    } catch {
      // If token refresh fails, proceed to standard error handling
    }
  }

  let errorDetail = `HTTP ${res.status}: ${res.statusText}`;
  try {
    const errorJson = await res.json();
    errorDetail = errorJson.detail || errorJson.error || JSON.stringify(errorJson);
  } catch {
    // Non-JSON response
  }

  const isSpecificAuthError = errorDetail && !errorDetail.startsWith("HTTP ");

  throw {
    status: res.status,
    message:
      res.status === 401
        ? isSpecificAuthError
          ? `Authentication failed: ${errorDetail}`
          : "Session expired or invalid token. Please sign in again."
        : res.status === 403
        ? "Access Denied: Your account is not authorized as an administrator in the server allowlist."
        : res.status === 429
        ? "Rate limit exceeded. Please wait a moment before trying again."
        : errorDetail,
    detail: errorDetail,
  };
}

/**
 * Creates a new campus event via POST /api/admin/events/.
 *
 * @param {Object} params
 * @param {string} [params.token] - Raw Clerk JWT bearer token
 * @param {Function} [params.getToken] - Clerk token getter
 * @param {Object} params.eventData - Form fields
 * @returns {Promise<Object>} The created, normalized event
 */
export async function createAdminEvent({ token, getToken, eventData }) {
  const authToken = token || (getToken ? await getValidAdminToken(getToken) : null);
  if (!authToken) {
    throw {
      status: 401,
      message: "Authentication token required. Please sign in.",
    };
  }

  const payload = toApiEventPayload(eventData);

  const res = await fetch(`${API_BASE_URL}/api/admin/events/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 201) {
    const data = await res.json();
    const normalized = normalizeEvent(data);

    // Synchronize to local storage for offline continuity
    try {
      const current = readStorage(STORAGE_KEYS.EVENTS, []);
      if (Array.isArray(current)) {
        current.unshift(normalized);
        writeStorage(STORAGE_KEYS.EVENTS, current);
      }
    } catch {
      // Local storage sync error ignored
    }

    return normalized;
  }

  let fieldErrors = null;
  let detailMessage = `Failed to create event (HTTP ${res.status})`;

  try {
    const errData = await res.json();
    if (typeof errData === "object" && errData !== null) {
      fieldErrors = errData;
      if (errData.detail) detailMessage = errData.detail;
      else if (errData.error) detailMessage = errData.error;
      else {
        const firstField = Object.keys(errData)[0];
        if (firstField) {
          const val = errData[firstField];
          detailMessage = Array.isArray(val) ? `${firstField}: ${val[0]}` : `${firstField}: ${val}`;
        }
      }
    }
  } catch {
    // Non-JSON error response
  }

  throw {
    status: res.status,
    message:
      res.status === 401 && detailMessage && !detailMessage.startsWith("Failed to create")
        ? `Authentication failed: ${detailMessage}`
        : detailMessage,
    detail: detailMessage,
    fieldErrors,
  };
}

/**
 * Updates an existing campus event via PUT /api/admin/events/{id}/.
 *
 * @param {Object} params
 * @param {string} [params.token] - Raw Clerk JWT bearer token
 * @param {Function} [params.getToken] - Clerk token getter
 * @param {string} params.id - Event ID
 * @param {Object} params.eventData - Form fields
 * @returns {Promise<Object>} The updated, normalized event
 */
export async function updateAdminEvent({ token, getToken, id, eventData }) {
  const authToken = token || (getToken ? await getValidAdminToken(getToken) : null);
  if (!authToken) {
    throw {
      status: 401,
      message: "Authentication token required. Please sign in.",
    };
  }

  if (!id) {
    throw { status: 400, message: "Event ID is required for update." };
  }

  const payload = toApiEventPayload(eventData);

  const res = await fetch(`${API_BASE_URL}/api/admin/events/${encodeURIComponent(id)}/`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 200) {
    const data = await res.json();
    const normalized = normalizeEvent(data);

    // Synchronize to local storage
    try {
      const current = readStorage(STORAGE_KEYS.EVENTS, []);
      if (Array.isArray(current)) {
        const idx = current.findIndex((e) => e.id === id);
        if (idx !== -1) current[idx] = normalized;
        else current.unshift(normalized);
        writeStorage(STORAGE_KEYS.EVENTS, current);
      }
    } catch {
      // Local storage sync error ignored
    }

    return normalized;
  }

  let fieldErrors = null;
  let detailMessage = `Failed to update event (HTTP ${res.status})`;

  try {
    const errData = await res.json();
    if (typeof errData === "object" && errData !== null) {
      fieldErrors = errData;
      if (errData.detail) detailMessage = errData.detail;
      else if (errData.error) detailMessage = errData.error;
      else {
        const firstField = Object.keys(errData)[0];
        if (firstField) {
          const val = errData[firstField];
          detailMessage = Array.isArray(val) ? `${firstField}: ${val[0]}` : `${firstField}: ${val}`;
        }
      }
    }
  } catch {
    // Non-JSON error response
  }

  throw {
    status: res.status,
    message:
      res.status === 401 && detailMessage && !detailMessage.startsWith("Failed to update")
        ? `Authentication failed: ${detailMessage}`
        : detailMessage,
    detail: detailMessage,
    fieldErrors,
  };
}

/**
 * Deletes a campus event via DELETE /api/admin/events/{id}/.
 *
 * @param {Object} params
 * @param {string} [params.token] - Raw Clerk JWT bearer token
 * @param {Function} [params.getToken] - Clerk token getter
 * @param {string} params.id - Event ID
 * @returns {Promise<{ success: boolean }>}
 */
export async function deleteAdminEvent({ token, getToken, id }) {
  const authToken = token || (getToken ? await getValidAdminToken(getToken) : null);
  if (!authToken) {
    throw {
      status: 401,
      message: "Authentication token required. Please sign in.",
    };
  }

  if (!id) {
    throw { status: 400, message: "Event ID is required for deletion." };
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/events/${encodeURIComponent(id)}/`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (res.status === 204) {
    // Synchronize local storage
    deleteEvent(id);
    return { success: true };
  }

  let detailMessage = `Failed to delete event (HTTP ${res.status})`;
  try {
    const errData = await res.json();
    if (errData.detail) detailMessage = errData.detail;
    else if (errData.error) detailMessage = errData.error;
  } catch {
    // Non-JSON error response
  }

  throw {
    status: res.status,
    message:
      res.status === 401 && detailMessage && !detailMessage.startsWith("Failed to delete")
        ? `Authentication failed: ${detailMessage}`
        : detailMessage,
    detail: detailMessage,
  };
}

// ── Synchronous Storage Interface (Preserved for backwards-compatibility) ─

/**
 * Retrieves all events, ensuring storage is populated.
 *
 * @returns {Array<Object>} List of all events.
 */
export function getEvents() {
  ensureSeeded();
  const events = readStorage(STORAGE_KEYS.EVENTS, []);
  return Array.isArray(events)
    ? events.map((e) => normalizeEvent(e)).filter(Boolean)
    : [];
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

  const venueId = eventData.venueId || eventData.venue;
  if (!venueId || !getVenueById(venueId)) {
    throw new Error(`Invalid venue ID: ${venueId}`);
  }

  const start =
    typeof eventData.start === "number"
      ? eventData.start
      : new Date(eventData.start || eventData.start_time).getTime();

  const end =
    typeof eventData.end === "number"
      ? eventData.end
      : new Date(eventData.end || eventData.end_time).getTime();

  if (isNaN(start) || isNaN(end) || start >= end) {
    throw new Error("Event end time must be after start time.");
  }

  const newEvent = {
    id:
      eventData.id ||
      `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: eventData.title.trim(),
    category: eventData.category || "Other",
    venueId,
    start,
    end,
    organizer: (eventData.organizer || "Campus Organizer").trim(),
    description: (eventData.description || "").trim(),
    isDemo: Boolean(eventData.isDemo ?? eventData.is_demo),
    createdAt: Date.now(),
  };

  const rawEvents = readStorage(STORAGE_KEYS.EVENTS, []);
  const events = Array.isArray(rawEvents) ? rawEvents : [];
  events.push(newEvent);
  writeStorage(STORAGE_KEYS.EVENTS, events);

  return normalizeEvent(newEvent);
}

/**
 * Updates an existing event by ID in storage.
 *
 * @param {string} id - Event ID to update.
 * @param {Object} updates - Updated fields.
 * @returns {Object|null} The updated event or null if not found.
 */
export function updateEvent(id, updates) {
  if (!id) return null;
  const rawEvents = readStorage(STORAGE_KEYS.EVENTS, []);
  const events = Array.isArray(rawEvents) ? rawEvents : [];
  const index = events.findIndex((e) => e.id === id);
  if (index === -1) return null;

  const current = events[index];
  const updated = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: Date.now(),
  };

  events[index] = updated;
  writeStorage(STORAGE_KEYS.EVENTS, events);
  return normalizeEvent(updated);
}

/**
 * Deletes an event by ID from storage.
 *
 * @param {string} id - Event ID.
 * @returns {boolean} True if deleted, false if not found.
 */
export function deleteEvent(id) {
  if (!id) return false;
  const rawEvents = readStorage(STORAGE_KEYS.EVENTS, []);
  const events = Array.isArray(rawEvents) ? rawEvents : [];
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
  const rawSaved = readStorage(STORAGE_KEYS.SAVED, []);
  if (!Array.isArray(rawSaved)) return [];
  return Array.from(
    new Set(rawSaved.filter((id) => typeof id === "string" && id.trim().length > 0))
  );
}

/**
 * Prunes stale, deleted, or orphaned event IDs from the saved list.
 * Only validates against known events when a non-empty collection is provided.
 * Preserves all legitimate saved events that exist in the provided list.
 *
 * @param {Array<Object>|Array<string>} availableEvents - Valid events or event IDs
 * @returns {Array<string>} Cleaned array of valid saved event IDs
 */
export function reconcileSavedEventIds(availableEvents) {
  if (!Array.isArray(availableEvents) || availableEvents.length === 0) {
    return getSavedEventIds();
  }
  const validIdSet = new Set(
    availableEvents
      .map((e) => (typeof e === "string" ? e.trim() : e?.id?.trim()))
      .filter(Boolean)
  );
  const currentSaved = getSavedEventIds();
  const pruned = currentSaved.filter((id) => validIdSet.has(id));

  if (pruned.length !== currentSaved.length) {
    writeStorage(STORAGE_KEYS.SAVED, pruned);
  }
  return pruned;
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
  if (!id || typeof id !== "string") return getSavedEventIds();
  const trimmedId = id.trim();
  if (!trimmedId) return getSavedEventIds();

  const saved = getSavedEventIds();
  const index = saved.indexOf(trimmedId);

  let updated;
  if (index === -1) {
    updated = [...saved, trimmedId];
  } else {
    updated = saved.filter((savedId) => savedId !== trimmedId);
  }

  writeStorage(STORAGE_KEYS.SAVED, updated);
  return updated;
}

/**
 * Returns full event objects for all saved event IDs.
 *
 * @param {Array<Object>} [eventsList=null] - Optional list of events to filter against.
 * @returns {Array<Object>} List of saved events.
 */
export function getSavedEvents(eventsList = null) {
  const savedIds = new Set(getSavedEventIds());
  const list = Array.isArray(eventsList) ? eventsList : getEvents();
  return list.filter((e) => savedIds.has(e.id));
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
      const venue = event.venue || (event.venueId ? getVenueById(event.venueId) : null);
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
