import { useState, useEffect, useCallback, useMemo } from "react";
import { fetchPublicEvents, getEvents } from "../services/eventService";
import { getStatus } from "../utils/eventTime";
import { getVenueById } from "../data/campusVenues";

/**
 * Validates that latitude and longitude are valid non-zero WGS84 numbers.
 *
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean} True if coordinates are valid WGS84
 */
export function isValidLatLng(lat, lng) {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    !isNaN(lat) &&
    !isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

/**
 * Extracts and validates numeric coordinates from a venue object.
 *
 * @param {Object} venue - Venue object
 * @returns {{ lat: number, lng: number } | null}
 */
export function getValidVenueCoordinates(venue) {
  if (!venue || typeof venue !== "object") return null;

  const lat =
    typeof venue.lat === "number" && !isNaN(venue.lat)
      ? venue.lat
      : typeof venue.coordinates?.lat === "number" && !isNaN(venue.coordinates?.lat)
      ? venue.coordinates.lat
      : parseFloat(venue.lat || venue.coordinates?.lat);

  const lng =
    typeof venue.lng === "number" && !isNaN(venue.lng)
      ? venue.lng
      : typeof venue.coordinates?.lng === "number" && !isNaN(venue.coordinates?.lng)
      ? venue.coordinates.lng
      : parseFloat(venue.lng || venue.coordinates?.lng);

  if (isValidLatLng(lat, lng)) {
    return { lat, lng };
  }
  return null;
}

/**
 * Custom hook to fetch and maintain currently ongoing campus events
 * for 2D and 3D campus map visualizations.
 *
 * - Fetches events once on mount via public event service with fallback.
 * - Filters for events where `start <= now < end` using `getStatus(event, now) === "live"`.
 * - Periodically updates `now` with a 30s timer to transition ended events off the map.
 * - Groups live events by venue / coordinate anchor so multiple concurrent events
 *   at the same venue do not create overlapping, unclickable markers.
 * - Explicitly tracks and preserves `isDemo` status.
 */
export function useLiveCampusEvents() {
  const [allEvents, setAllEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // 1. Fetch public events on mount
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchPublicEvents({ all: true });
      if (res && Array.isArray(res.results)) {
        setAllEvents(res.results);
        setIsLiveApi(!res.isFallback);
      } else {
        const local = getEvents();
        setAllEvents(local);
        setIsLiveApi(false);
      }
    } catch (err) {
      console.warn("[useLiveCampusEvents] Failed to fetch events from API, using local fallback:", err);
      try {
        const local = getEvents();
        setAllEvents(local);
        setIsLiveApi(false);
      } catch (fallbackErr) {
        console.error("[useLiveCampusEvents] Fallback failed:", fallbackErr);
        setAllEvents([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // 2. Periodic timer to keep `now` fresh (every 30 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  // 3. Filter for currently ongoing ("live") events with valid coordinates
  const liveEvents = useMemo(() => {
    if (!Array.isArray(allEvents) || allEvents.length === 0) return [];

    return allEvents.filter((event) => {
      if (!event) return false;
      const status = getStatus(event, now);
      if (status !== "live") return false;

      const venue = event.venue || (event.venueId ? getVenueById(event.venueId) : null);
      if (!venue) return false;

      const coords = getValidVenueCoordinates(venue);
      return coords !== null;
    });
  }, [allEvents, now]);

  // 4. Group ongoing events by venue key
  const groupedVenues = useMemo(() => {
    if (!liveEvents || liveEvents.length === 0) return [];

    const venueMap = new Map();

    for (const event of liveEvents) {
      const rawVenue = event.venue || (event.venueId ? getVenueById(event.venueId) : null);
      const coords = getValidVenueCoordinates(rawVenue);
      if (!coords) continue;

      const venueKey = rawVenue.id || `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}`;

      if (!venueMap.has(venueKey)) {
        venueMap.set(venueKey, {
          key: venueKey,
          venue: {
            ...rawVenue,
            lat: coords.lat,
            lng: coords.lng,
            coordinates: coords,
          },
          lat: coords.lat,
          lng: coords.lng,
          events: [],
          hasDemo: false,
        });
      }

      const group = venueMap.get(venueKey);
      group.events.push(event);
      if (event.isDemo) {
        group.hasDemo = true;
      }
    }

    return Array.from(venueMap.values());
  }, [liveEvents]);

  return {
    allEvents,
    liveEvents,
    groupedVenues,
    isLoading,
    isLiveApi,
    now,
    refresh: loadEvents,
  };
}
