import React from "react";
import {
  X,
  MapPin,
  Building,
  Layers,
  Footprints,
  Navigation,
  Compass,
  CheckCircle2,
} from "lucide-react";

/**
 * VenueModal Component
 *
 * Detailed modal dialog displaying verified campus venue metadata:
 * - Building, floor, room number
 * - Landmark & walking directions
 * - Coordinates & indoor map capabilities
 */
export default function VenueModal({ venue, onClose, onNavigateToVenue }) {
  if (!venue) return null;

  const floorLabel =
    venue.floor !== null && venue.floor !== undefined
      ? venue.floor === 0
        ? "Ground Floor"
        : venue.floor === 1
        ? "First Floor"
        : venue.floor === 2
        ? "Second Floor"
        : `Floor ${venue.floor}`
      : "Outdoor Campus Grounds";

  return (
    <div
      className="smartnav-venue-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-modal-title"
    >
      <div className="smartnav-venue-modal-card">
        {/* Modal Header */}
        <div className="smartnav-venue-modal__header">
          <div className="flex items-center gap-3">
            <div className="smartnav-venue-icon-box">
              <MapPin size={22} className="text-teal-600" />
            </div>
            <div>
              <h2 id="venue-modal-title" className="smartnav-venue-modal__title">
                {venue.name}
              </h2>
              <span className="smartnav-venue-modal__category">
                {venue.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="smartnav-venue-close-btn"
            onClick={onClose}
            aria-label="Close venue modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Info Grid */}
        <div className="smartnav-venue-modal__body">
          <div className="smartnav-venue-details-grid">
            <div className="smartnav-venue-info-tile">
              <div className="smartnav-venue-tile-label">
                <Building size={14} />
                <span>Building</span>
              </div>
              <div className="smartnav-venue-tile-value">
                {venue.building}
              </div>
            </div>

            <div className="smartnav-venue-info-tile">
              <div className="smartnav-venue-tile-label">
                <Layers size={14} />
                <span>Floor Level</span>
              </div>
              <div className="smartnav-venue-tile-value">
                {floorLabel}
              </div>
            </div>

            {venue.roomNo && (
              <div className="smartnav-venue-info-tile">
                <div className="smartnav-venue-tile-label">
                  <Navigation size={14} />
                  <span>Room Number</span>
                </div>
                <div className="smartnav-venue-tile-value font-mono text-teal-700">
                  {venue.roomNo}
                </div>
              </div>
            )}

            <div className="smartnav-venue-info-tile">
              <div className="smartnav-venue-tile-label">
                <Compass size={14} />
                <span>GPS Coordinates</span>
              </div>
              <div className="smartnav-venue-tile-value text-xs font-mono">
                {venue.coordinates.lat.toFixed(6)}, {venue.coordinates.lng.toFixed(6)}
              </div>
            </div>
          </div>

          {/* Landmark */}
          {venue.landmark && (
            <div className="smartnav-venue-section">
              <h4 className="smartnav-venue-section__title">
                <span>🧭 Landmark</span>
              </h4>
              <p className="smartnav-venue-section__text">{venue.landmark}</p>
            </div>
          )}

          {/* Directions */}
          {venue.directions && (
            <div className="smartnav-venue-section">
              <h4 className="smartnav-venue-section__title">
                <Footprints size={15} className="inline mr-1 text-teal-600" />
                <span>Walking Directions from Main Gate</span>
              </h4>
              <p className="smartnav-venue-section__text">{venue.directions}</p>
            </div>
          )}

          {/* Capabilities Badge */}
          <div className="smartnav-venue-capability-box">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <div className="text-xs text-slate-600">
              {venue.hasIndoorMap ? (
                <span>
                  <strong>Interactive Indoor Plan Available:</strong> Room-level floor navigation is enabled for this building.
                </span>
              ) : (
                <span>
                  <strong>Campus Landmark:</strong> Outdoor campus route navigation to building perimeter is supported.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="smartnav-venue-modal__footer">
          <button
            type="button"
            className="smartnav-venue-modal__done-btn"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="smartnav-venue-modal__nav-btn"
            onClick={() => {
              onNavigateToVenue?.(venue);
              onClose?.();
            }}
          >
            <Navigation size={15} />
            <span>Navigate to Venue</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Displays venue details for a selected campus event.