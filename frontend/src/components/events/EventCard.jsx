import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Bookmark,
  Building,
  Radio,
  Sparkles,
  Navigation,
} from "lucide-react";
import { getStatus, countdown, formatEventDateTime } from "../../utils/eventTime.js";
import { getVenueById } from "../../data/campusVenues.js";

const CATEGORY_COLORS = {
  Tech: { bg: "#e0f2fe", text: "#0369a1", border: "#bae6fd" },
  Cultural: { bg: "#fce7f3", text: "#be185d", border: "#fbcfe8" },
  Sports: { bg: "#ffedd5", text: "#c2410c", border: "#fed7aa" },
  Workshop: { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  Seminar: { bg: "#ede9fe", text: "#6d28d9", border: "#ddd6fe" },
  Other: { bg: "#f1f5f9", text: "#475569", border: "#e2e8f0" },
};

/**
 * Reusable Event Card Component
 *
 * Displays event category, demo badge, title, organizer, live status badge with
 * countdown, time and venue metadata, description, save toggle, venue details,
 * and direct "Navigate to Event" action.
 */
export default function EventCard({
  event,
  now = Date.now(),
  isSaved = false,
  onToggleSave,
  onOpenVenue,
  onNavigateToEvent,
}) {
  const status = getStatus(event, now);
  const countdownText = countdown(event, now);
  const timeFormatted = formatEventDateTime(event.start, event.end, now);

  const venue = event.venue || (event.venueId ? getVenueById(event.venueId) : null);
  const venueDisplay = venue
    ? `${venue.name}${venue.building ? ` (${venue.building})` : ""}`
    : "Campus Venue";

  const catStyle = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.Other;

  return (
    <article
      className={`smartnav-event-card ${
        status === "live" ? "smartnav-event-card--live" : ""
      } ${status === "ended" ? "smartnav-event-card--ended" : ""}`}
      id={`event-card-${event.id}`}
    >
      {/* Top Header: Category, Demo Badge & Save Bookmark */}
      <div className="smartnav-event-card__header">
        <div className="smartnav-event-card__badges">
          <span
            className="smartnav-event-category-badge"
            style={{
              backgroundColor: catStyle.bg,
              color: catStyle.text,
              borderColor: catStyle.border,
            }}
          >
            {event.category}
          </span>

          {event.isDemo && (
            <span className="smartnav-event-demo-tag" title="Demonstration Event">
              Demo
            </span>
          )}
        </div>

        <button
          type="button"
          className={`smartnav-event-save-btn ${
            isSaved ? "smartnav-event-save-btn--saved" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave?.(event.id);
          }}
          title={isSaved ? "Remove from saved events" : "Save this event"}
          aria-label={isSaved ? "Saved event" : "Save event"}
        >
          <Bookmark
            size={18}
            className={isSaved ? "fill-current text-amber-500" : "text-slate-400"}
          />
        </button>
      </div>

      {/* Title & Organizer */}
      <div className="smartnav-event-card__title-group">
        <h3 className="smartnav-event-card__title">{event.title}</h3>
        <p className="smartnav-event-card__organizer">
          <span>By {event.organizer}</span>
        </p>
      </div>

      {/* Status & Countdown Banner */}
      <div className="smartnav-event-card__status-banner">
        <div className={`smartnav-event-status-pill smartnav-event-status-pill--${status}`}>
          {status === "live" && (
            <span className="smartnav-event-status-dot" aria-hidden="true" />
          )}
          <span>
            {status === "live"
              ? "Live Now"
              : status === "today"
              ? "Today"
              : status === "upcoming"
              ? "Upcoming"
              : "Ended"}
          </span>
        </div>

        {countdownText && (
          <div className="smartnav-event-countdown">
            <Clock size={13} strokeWidth={2.2} />
            <span>{countdownText}</span>
          </div>
        )}
      </div>

      {/* Meta Info: Time and Venue */}
      <div className="smartnav-event-card__meta-list">
        <div className="smartnav-event-card__meta-item">
          <Calendar size={15} className="smartnav-event-meta-icon" />
          <span>{timeFormatted}</span>
        </div>

        <div className="smartnav-event-card__meta-item">
          <MapPin size={15} className="smartnav-event-meta-icon" />
          <span className="truncate">{venueDisplay}</span>
        </div>
      </div>

      {/* Short Description */}
      {event.description && (
        <p className="smartnav-event-card__desc">{event.description}</p>
      )}

      {/* Card Footer: Action */}
      <div className="smartnav-event-card__footer">
        <div className="smartnav-event-card__actions">
          {venue && (
            <button
              type="button"
              className="smartnav-event-nav-btn"
              onClick={() => onNavigateToEvent?.(event)}
              title={`Navigate to ${venue.name}`}
            >
              <Navigation size={13} className="smartnav-event-nav-icon" />
              <span>Navigate</span>
            </button>
          )}

          {venue && (
            <button
              type="button"
              className="smartnav-event-venue-btn"
              onClick={() => onOpenVenue?.(venue)}
            >
              <Building size={13} />
              <span>Venue</span>
            </button>
          )}
        </div>

        {status === "live" && (
          <span className="smartnav-event-live-indicator">
            <Radio size={13} className="animate-pulse text-emerald-600" />
            <span>Live</span>
          </span>
        )}
      </div>
    </article>
  );
}
