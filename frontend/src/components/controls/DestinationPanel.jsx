import {
  Building2,
  House,
  Layers3,
  MapPin,
  Navigation,
} from "lucide-react";

function collectCoordinatePairs(value, points = []) {
  if (!Array.isArray(value)) {
    return points;
  }

  if (
    value.length >= 2 &&
    typeof value[0] === "number" &&
    typeof value[1] === "number"
  ) {
    points.push([value[0], value[1]]);
    return points;
  }

  value.forEach((child) =>
    collectCoordinatePairs(child, points)
  );

  return points;
}

function getRepresentativeCoordinate(destination) {
  const points = collectCoordinatePairs(
    destination?.coordinates
  );

  if (!points.length) {
    return null;
  }

  const total = points.reduce(
    (accumulator, [lng, lat]) => ({
      lng: accumulator.lng + lng,
      lat: accumulator.lat + lat,
    }),
    { lng: 0, lat: 0 }
  );

  return {
    lat: total.lat / points.length,
    lng: total.lng / points.length,
  };
}

function getDistanceInMeters(
  from,
  destination
) {
  const target =
    getRepresentativeCoordinate(
      destination
    );

  if (!from || !target) {
    return null;
  }

  const earthRadius = 6371000;

  const toRadians = (degrees) =>
    (degrees * Math.PI) / 180;

  const deltaLat = toRadians(
    target.lat - from.lat
  );

  const deltaLng = toRadians(
    target.lng - from.lng
  );

  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(target.lat);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) ** 2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return earthRadius * c;
}

function formatDistance(distance) {
  if (distance === null) {
    return "Locating…";
  }

  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${(distance / 1000).toFixed(1)} km`;
}

function getWalkingTime(distance) {
  if (distance === null) {
    return null;
  }

  // Approx. 50 metres/minute for the preview.
  return Math.max(
    1,
    Math.ceil(distance / 50)
  );
}

export default function DestinationPanel({
  destination,
  currentLocation,
  onStartNavigation,
  onClose,
}) {
  if (!destination) {
    return null;
  }

  const distance =
    getDistanceInMeters(
      currentLocation,
      destination
    );

  const walkingTime =
    getWalkingTime(distance);

  const building =
    destination.building ||
    "Unknown Building";

  const floor =
    destination.floorLabel ||
    "Floor unavailable";

  const category =
    destination.category ||
    "Destination";

  return (
    <aside
      className="smartnav-destination-panel"
      aria-label="Destination information"
    >
      <div className="smartnav-destination-header">
        <div className="smartnav-destination-badge">
          <Building2
            size={13}
            strokeWidth={2.2}
          />

          {building.toUpperCase()}
        </div>

        <button
          type="button"
          className="smartnav-destination-close"
          onClick={onClose}
          aria-label="Close destination"
          title="Close"
        >
          ×
        </button>
      </div>

      <div className="smartnav-destination-room">
        {destination.roomNo}
      </div>

      <div className="smartnav-destination-name">
        {destination.name ||
          "Unnamed destination"}
      </div>

      <div className="smartnav-destination-details">

        <div className="smartnav-destination-row">
          <div className="smartnav-destination-icon">
            <Building2 size={17} />
          </div>

          <div>
            <div className="smartnav-destination-label">
              Building
            </div>

            <div className="smartnav-destination-value">
              {building}
            </div>
          </div>
        </div>

        <div className="smartnav-destination-row">
          <div className="smartnav-destination-icon">
            <Layers3 size={17} />
          </div>

          <div>
            <div className="smartnav-destination-label">
              Floor
            </div>

            <div className="smartnav-destination-value">
              {floor}
            </div>
          </div>
        </div>

        <div className="smartnav-destination-row">
          <div className="smartnav-destination-icon">
            <House size={17} />
          </div>

          <div>
            <div className="smartnav-destination-label">
              Category
            </div>

            <div className="smartnav-destination-value">
              {category}
            </div>
          </div>
        </div>

        <div className="smartnav-destination-row">
          <div className="smartnav-destination-icon">
            <MapPin size={17} />
          </div>

          <div>
            <div className="smartnav-destination-label">
              Distance from you
            </div>

            <div className="smartnav-destination-value">
              {formatDistance(distance)}

              {walkingTime !== null &&
                ` · ~${walkingTime} min walk`}
            </div>
          </div>
        </div>

      </div>

      <button
        type="button"
        className="smartnav-destination-cta"
        onClick={onStartNavigation}
      >
        <Navigation
          size={17}
          strokeWidth={2.2}
        />

        Start Navigation
      </button>
    </aside>
  );
}