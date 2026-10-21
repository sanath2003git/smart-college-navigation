import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  Bookmark,
  Calendar,
  Sparkles,
  RotateCcw,
  Radio,
  Flame,
  Layers,
  Info,
} from "lucide-react";

import EventCard from "../../components/events/EventCard.jsx";
import FilterChips from "../../components/events/FilterChips.jsx";
import VenueModal from "../../components/events/VenueModal.jsx";

import {
  getEvents,
  getSavedEventIds,
  reconcileSavedEventIds,
  toggleSavedEvent,
  resetDemoEvents,
  getVenueById,
  fetchPublicEvents,
  fetchPublicVenues,
} from "../../services/eventService.js";
import { getStatus, statusPriority } from "../../utils/eventTime.js";
import { useNavigation } from "../../hooks/useNavigation.js";
import { useLocation } from "../../hooks/useLocation.js";
import { startNavigationToVenue } from "../../services/venueNavigationService.js";

/**
 * EventsPage Component
 *
 * Full-featured campus event discovery dashboard:
 * - Live Now, Today, Upcoming, and Recently Ended sections
 * - Category filter chips with dynamic counts
 * - Text search across title, organizer, description, venue
 * - Bookmarked / Saved Events tab
 * - 30s auto-refresh timer for live countdowns
 * - Demo mode banner and reset action
 * - Venue details modal and direct "Navigate to Event" action
 */
export default function EventsPage() {
  const navigate = useNavigate();
  const navContext = useNavigation();
  const locationContext = useLocation();

  // ── State ──────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("all"); // "all" | "saved"
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVenue, setSelectedVenue] = useState(null);

  // Storage events & bookmarks
  const [events, setEvents] = useState(() => getEvents());
  const [savedIds, setSavedIds] = useState(() => getSavedEventIds());
  const [noticeVisible, setNoticeVisible] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);

  // Periodic clock tick (30s) to refresh live statuses & countdowns
  const [now, setNow] = useState(() => Date.now());

  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    try {
      const res = await fetchPublicEvents({ all: true });
      if (res && Array.isArray(res.results) && !res.isFallback) {
        setEvents(res.results);
        setIsLiveApi(true);
        const reconciled = reconcileSavedEventIds(res.results);
        setSavedIds(reconciled);
      } else {
        const local = getEvents();
        setEvents(local);
        const reconciled = reconcileSavedEventIds(local);
        setSavedIds(reconciled);
      }
    } catch (err) {
      console.warn("[EventsPage] Live API load error, using cached/demo events:", err);
      const local = getEvents();
      setEvents(local);
      const reconciled = reconcileSavedEventIds(local);
      setSavedIds(reconciled);
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30_000);
    return () => clearInterval(timer);
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────
  const handleToggleSave = useCallback((id) => {
    const updated = toggleSavedEvent(id);
    setSavedIds([...updated]);
  }, []);

  const handleResetDemo = useCallback(() => {
    if (window.confirm("Reset demonstration events back to initial clean state?")) {
      const refreshed = resetDemoEvents();
      setEvents(refreshed);
      setSavedIds(getSavedEventIds());
      setNow(Date.now());
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("All");
  }, []);

  // ── Navigation Handlers ────────────────────────────────────────────
  const handleNavigateToVenue = useCallback(
    async (venue) => {
      if (!venue) return;
      await startNavigationToVenue(venue, navContext, navigate, {
        fallbackLocation:
          locationContext?.rawLocation || locationContext?.location,
      });
    },
    [navContext, navigate, locationContext]
  );

  const handleNavigateToEvent = useCallback(
    async (event) => {
      const venue = event.venue || (event?.venueId ? getVenueById(event.venueId) : null);
      if (!venue) {
        alert("Unable to locate venue information for this event.");
        return;
      }
      await handleNavigateToVenue(venue);
    },
    [handleNavigateToVenue]
  );

  // ── Filter & Search Computation ────────────────────────────────────
  const filteredEvents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      // 1. Saved Tab filter
      if (activeTab === "saved" && !savedIds.includes(event.id)) {
        return false;
      }

      // 2. Category filter
      if (selectedCategory !== "All" && event.category !== selectedCategory) {
        return false;
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
  }, [events, activeTab, savedIds, selectedCategory, searchQuery]);

  // ── Status Sections ────────────────────────────────────────────────
  const liveEvents = useMemo(() => {
    return filteredEvents.filter((e) => getStatus(e, now) === "live");
  }, [filteredEvents, now]);

  const todayEvents = useMemo(() => {
    return filteredEvents.filter((e) => getStatus(e, now) === "today");
  }, [filteredEvents, now]);

  const upcomingEvents = useMemo(() => {
    return filteredEvents.filter((e) => getStatus(e, now) === "upcoming");
  }, [filteredEvents, now]);

  const endedEvents = useMemo(() => {
    return filteredEvents.filter((e) => getStatus(e, now) === "ended");
  }, [filteredEvents, now]);

  // ── Single Source of Truth for Valid Saved Events ────────────────
  const validSavedEvents = useMemo(() => {
    if (!Array.isArray(events) || events.length === 0 || !Array.isArray(savedIds)) {
      return [];
    }
    const savedSet = new Set(savedIds);
    return events.filter((e) => e && e.id && savedSet.has(e.id));
  }, [events, savedIds]);

  const validSavedCount = validSavedEvents.length;

  // ── Dynamic Category Counts (for non-ended events in active tab) ───
  const categoryCounts = useMemo(() => {
    const baseList =
      activeTab === "saved"
        ? validSavedEvents
        : events;

    const counts = { All: 0 };
    for (const e of baseList) {
      if (getStatus(e, now) !== "ended") {
        counts.All = (counts.All || 0) + 1;
        counts[e.category] = (counts[e.category] || 0) + 1;
      }
    }
    return counts;
  }, [events, activeTab, validSavedEvents, now]);

  const liveTotalCount = useMemo(() => {
    return events.filter((e) => getStatus(e, now) === "live").length;
  }, [events, now]);

  return (
    <div className="smartnav-events-page">
      {/* ── Demo / Live Notice Banner ─────────────────────────────────── */}
      {noticeVisible && (
        <div className="smartnav-events-demo-banner" role="alert">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Sparkles
              size={15}
              className={isLiveApi ? "text-teal-600 shrink-0" : "text-amber-500 shrink-0"}
            />
            <span className="smartnav-events-demo-text truncate">
              {isLiveApi ? (
                <>
                  <strong>Campus Events:</strong> Synchronized with SmartNav live database
                </>
              ) : (
                <>
                  <strong>Demo:</strong> Sample campus events mapped to TKM College venues
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isLiveApi ? (
              <button
                type="button"
                className="smartnav-events-reset-btn"
                onClick={loadEvents}
                disabled={isLoadingEvents}
                title="Refresh events from server"
              >
                <RotateCcw size={12} className={isLoadingEvents ? "animate-spin" : ""} />
                <span className="smartnav-reset-label">Refresh</span>
              </button>
            ) : (
              <button
                type="button"
                className="smartnav-events-reset-btn"
                onClick={handleResetDemo}
                title="Reset demonstration data"
              >
                <RotateCcw size={12} />
                <span className="smartnav-reset-label">Reset Data</span>
              </button>
            )}

            <button
              type="button"
              className="smartnav-events-banner-close"
              onClick={() => setNoticeVisible(false)}
              aria-label="Dismiss notice"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Page Hero Header ────────────────────────────────────────── */}
      <header className="smartnav-events-header">
        <div className="smartnav-events-header__intro">
          <h1 className="smartnav-events-header__title">Campus Events</h1>
          <p className="smartnav-events-header__subtitle">
            Discover tech sprints, cultural showcases, workshops, and sports happening on campus.
          </p>
        </div>

        {/* View Toggle (All Events vs Saved Events) */}
        <div className="smartnav-events-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "all"}
            className={`smartnav-events-tab ${
              activeTab === "all" ? "smartnav-events-tab--active" : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            <span>All Events</span>
            {liveTotalCount > 0 && (
              <span className="smartnav-events-tab__badge smartnav-events-tab__badge--live">
                <span className="smartnav-live-dot" />
                {liveTotalCount} Live
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "saved"}
            className={`smartnav-events-tab ${
              activeTab === "saved" ? "smartnav-events-tab--active" : ""
            }`}
            onClick={() => setActiveTab("saved")}
          >
            <Bookmark size={14} className={validSavedCount > 0 ? "fill-current" : ""} />
            <span>Saved Events</span>
            <span className="smartnav-events-tab__badge">
              {validSavedCount}
            </span>
          </button>
        </div>
      </header>

      {/* ── Controls: Search & Category Chips ───────────────────────── */}
      <div className="smartnav-events-controls">
        {/* Search Bar */}
        <div className="smartnav-events-search-wrapper">
          <Search size={18} className="smartnav-events-search-icon" />
          <input
            type="text"
            className="smartnav-events-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, organizer, venue, or room..."
            aria-label="Search events"
          />
          {searchQuery && (
            <button
              type="button"
              className="smartnav-events-search-clear"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search query"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <FilterChips
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          counts={categoryCounts}
        />
      </div>

      {/* ── Content Sections ────────────────────────────────────────── */}
      <main className="smartnav-events-main-content">
        {/* Empty Search / Filter State */}
        {filteredEvents.length === 0 ? (
          <div className="smartnav-events-empty-state">
            <div className="smartnav-events-empty-icon-wrap">
              {activeTab === "saved" ? (
                <Bookmark size={36} className="text-slate-400" />
              ) : (
                <Search size={36} className="text-slate-400" />
              )}
            </div>
            <h3 className="smartnav-events-empty-title">
              {activeTab === "saved"
                ? "No saved events yet"
                : events.length === 0
                ? "No events scheduled"
                : "No matching events found"}
            </h3>
            <p className="smartnav-events-empty-text">
              {activeTab === "saved"
                ? "Bookmark events by clicking the bookmark icon on any event card to view them here."
                : events.length === 0
                ? "There are currently no events scheduled on campus. Check back soon for upcoming campus activities."
                : "Try adjusting your search query or selecting a different category filter."}
            </p>
            {activeTab === "all" && (searchQuery || selectedCategory !== "All") && (
              <button
                type="button"
                className="smartnav-events-empty-btn"
                onClick={handleClearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="smartnav-events-sections-stack">
            {/* ── Section 1: LIVE NOW (Prominent Grid) ──────────────── */}
            {liveEvents.length > 0 && (
              <section className="smartnav-event-section smartnav-event-section--live" aria-label="Live Events">
                <div className="smartnav-event-section__header">
                  <div className="smartnav-event-section__badge smartnav-event-section__badge--live">
                    <span className="smartnav-live-dot" />
                    <span>Happening Now</span>
                  </div>
                  <h2 className="smartnav-event-section__title">
                    Live On Campus ({liveEvents.length})
                  </h2>
                </div>

                <div className="smartnav-events-grid">
                  {liveEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      now={now}
                      isSaved={savedIds.includes(event.id)}
                      onToggleSave={handleToggleSave}
                      onOpenVenue={setSelectedVenue}
                      onNavigateToEvent={handleNavigateToEvent}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Section 2: TODAY ───────────────────────────────────── */}
            {todayEvents.length > 0 && (
              <section className="smartnav-event-section" aria-label="Today Events">
                <div className="smartnav-event-section__header">
                  <div className="smartnav-event-section__badge">
                    <Flame size={14} className="text-amber-500" />
                    <span>Today</span>
                  </div>
                  <h2 className="smartnav-event-section__title">
                    Starting Later Today ({todayEvents.length})
                  </h2>
                </div>

                <div className="smartnav-events-grid">
                  {todayEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      now={now}
                      isSaved={savedIds.includes(event.id)}
                      onToggleSave={handleToggleSave}
                      onOpenVenue={setSelectedVenue}
                      onNavigateToEvent={handleNavigateToEvent}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Section 3: UPCOMING ────────────────────────────────── */}
            {upcomingEvents.length > 0 && (
              <section className="smartnav-event-section" aria-label="Upcoming Events">
                <div className="smartnav-event-section__header">
                  <div className="smartnav-event-section__badge">
                    <Calendar size={14} className="text-teal-600" />
                    <span>Upcoming</span>
                  </div>
                  <h2 className="smartnav-event-section__title">
                    Upcoming Days ({upcomingEvents.length})
                  </h2>
                </div>

                <div className="smartnav-events-grid">
                  {upcomingEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      now={now}
                      isSaved={savedIds.includes(event.id)}
                      onToggleSave={handleToggleSave}
                      onOpenVenue={setSelectedVenue}
                      onNavigateToEvent={handleNavigateToEvent}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── Section 4: RECENTLY ENDED ──────────────────────────── */}
            {endedEvents.length > 0 && (
              <section className="smartnav-event-section smartnav-event-section--ended" aria-label="Ended Events">
                <div className="smartnav-event-section__header">
                  <div className="smartnav-event-section__badge smartnav-event-section__badge--ended">
                    <span>Ended</span>
                  </div>
                  <h2 className="smartnav-event-section__title text-slate-500">
                    Recently Ended ({endedEvents.length})
                  </h2>
                </div>

                <div className="smartnav-events-grid">
                  {endedEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      now={now}
                      isSaved={savedIds.includes(event.id)}
                      onToggleSave={handleToggleSave}
                      onOpenVenue={setSelectedVenue}
                      onNavigateToEvent={handleNavigateToEvent}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      {/* ── Venue Details Modal ─────────────────────────────────────── */}
      {selectedVenue && (
        <VenueModal
          venue={selectedVenue}
          onClose={() => setSelectedVenue(null)}
          onNavigateToVenue={handleNavigateToVenue}
        />
      )}
    </div>
  );
}

// Provides the campus events page and its event listings.