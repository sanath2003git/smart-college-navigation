import { useEffect, useMemo, useCallback } from "react";
import { Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  Clock,
  Building,
  Navigation,
} from "lucide-react";
import { formatDuration } from "../../utils/eventTime";

/**
 * Creates a Leaflet divIcon representing an ongoing event venue anchor.
 *
 * @param {number} count - Total ongoing events at this venue
 * @param {boolean} hasDemo - Whether any event in the group is a demo record
 * @returns {L.DivIcon}
 */
function createEventLeafletIcon(count, hasDemo) {
  return L.divIcon({
    className: "smartnav-event-marker-leaflet-container",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
    html: `
      <div class="smartnav-map-event-marker ${hasDemo ? "smartnav-map-event-marker--demo" : ""}">
        <span class="smartnav-event-marker-pulse"></span>
        <div class="smartnav-event-marker-core">
          <svg class="smartnav-event-marker-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/>
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/>
            <circle cx="12" cy="12" r="2"/>
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/>
            <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19"/>
          </svg>
          ${count > 1 ? `<span class="smartnav-event-marker-count">${count}</span>` : ""}
        </div>
      </div>
    `,
  });
}

/**
 * EventMapMarkersLayer Component
 *
 * Renders interactive markers for ongoing campus events on the Leaflet 2D map.
 * - Uses dedicated `eventMarkerPane` (zIndex 550) to avoid occluding GPS puck or routes.
 * - Renders event popups with titles, categories, venue details, end times, and navigation triggers.
 *
 * @param {Object} props
 * @param {Array<Object>} props.groupedVenues - List of grouped venue anchors with ongoing events
 * @param {Function} props.onNavigateToVenue - Navigation trigger callback (venue) => void
 * @param {number} [props.now] - Current epoch ms reference timestamp
 */
export default function EventMapMarkersLayer({
  groupedVenues = [],
  onNavigateToVenue,
  now = Date.now(),
}) {
  const map = useMap();

  // Create dedicated pane above building polygons (400) and below GPS marker (600) / route (620)
  // Must be executed synchronously so the pane exists before react-leaflet creates child Markers
  if (map && !map.getPane("eventMarkerPane")) {
    const pane = map.createPane("eventMarkerPane");
    pane.style.zIndex = "550";
  }

  // Ensure pane exists in Leaflet DOM before rendering markers to prevent appendChild errors
  const isPaneReady = Boolean(map && map.getPane("eventMarkerPane"));

  const handleNavigate = useCallback(
    async (venue) => {
      if (typeof onNavigateToVenue === "function") {
        await onNavigateToVenue(venue);
      }
      if (map) {
        map.closePopup();
      }
    },
    [onNavigateToVenue, map]
  );

  if (!isPaneReady || !Array.isArray(groupedVenues) || groupedVenues.length === 0) {
    return null;
  }

  return (
    <>
      {groupedVenues.map((group) => {
        const { key, lat, lng, venue, events, hasDemo } = group;
        if (typeof lat !== "number" || typeof lng !== "number") return null;

        const icon = createEventLeafletIcon(events.length, hasDemo);

        const floorLabel =
          venue.floor !== null && venue.floor !== undefined
            ? venue.floor === 0
              ? "Ground Floor"
              : venue.floor === 1
              ? "First Floor"
              : venue.floor === 2
              ? "Second Floor"
              : `Floor ${venue.floor}`
            : null;

        return (
          <Marker
            key={key}
            position={[lat, lng]}
            icon={icon}
            pane="eventMarkerPane"
          >
            <Popup
              pane="popupPane"
              className="smartnav-leaflet-event-popup"
              maxWidth={320}
              minWidth={240}
              autoPan={true}
              autoPanPadding={[16, 16]}
              closeButton={true}
              closeOnClick={true}
            >
              <div className="smartnav-event-popup-container">
                {events.map((event, idx) => {
                  const remainingMs = event.end - now;
                  const endTimeStr = new Date(event.end).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  const durationStr =
                    remainingMs > 0 ? ` (in ${formatDuration(remainingMs)})` : "";

                  return (
                    <div
                      key={event.id || idx}
                      className="smartnav-event-popup-card"
                      style={
                        idx > 0
                          ? {
                              marginTop: "10px",
                              paddingTop: "10px",
                              borderTop: "1px solid #E2E8F0",
                            }
                          : undefined
                      }
                    >
                      <div className="smartnav-event-popup-header">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="smartnav-event-popup-live-badge">
                            <span className="smartnav-event-popup-live-dot"></span>
                            LIVE NOW
                          </span>
                          {event.category && (
                            <span className="smartnav-event-popup-cat-badge">
                              {event.category}
                            </span>
                          )}
                          {event.isDemo && (
                            <span
                              className="smartnav-event-popup-demo-badge"
                              title="Demonstration Event"
                            >
                              Demo
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="smartnav-event-popup-title">
                        {event.title || "Untitled Event"}
                      </h4>

                      <div className="smartnav-event-popup-meta">
                        <div className="smartnav-event-popup-meta-row">
                          <Building size={13} className="shrink-0 text-slate-500" />
                          <span className="leading-snug break-words">
                            <strong>{venue.name || "Campus Venue"}</strong>
                            {venue.building && venue.building !== venue.name
                              ? ` (${venue.building})`
                              : ""}
                          </span>
                        </div>

                        {(floorLabel || venue.roomNo) && (
                          <div className="smartnav-event-popup-meta-row text-xs text-slate-600 pl-4 break-words">
                            {floorLabel || ""}
                            {venue.roomNo ? ` · Room ${venue.roomNo}` : ""}
                          </div>
                        )}

                        <div className="smartnav-event-popup-meta-row text-xs text-slate-600">
                          <Clock size={13} className="shrink-0 text-amber-600" />
                          <span>
                            Ends {endTimeStr}
                            {durationStr}
                          </span>
                        </div>
                      </div>

                      <div className="smartnav-event-popup-footer">
                        <button
                          type="button"
                          className="smartnav-event-popup-nav-btn"
                          onClick={() => handleNavigate(venue)}
                        >
                          <Navigation size={13} className="shrink-0" />
                          <span>Navigate to Venue</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
