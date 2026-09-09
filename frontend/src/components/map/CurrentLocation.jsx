import { useEffect } from "react";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

import { useLocation } from "../../hooks/useLocation";
import { useNavigation } from "../../hooks/useNavigation";

const userIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:18px;
      height:18px;
      background:#2563eb;
      border:3px solid white;
      border-radius:50%;
      box-shadow:0 0 10px rgba(37,99,235,.8);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

export default function CurrentLocation() {
  const {
    location,
    rawLocation,
  } = useLocation();

  const { setCurrentLocation } = useNavigation();

  /*
   * IMPORTANT:
   * Use RAW GPS for navigation/building detection.
   * The displayed location may be snapped to a walkway.
   */
  useEffect(() => {
    if (rawLocation) {
      setCurrentLocation(rawLocation);
    }
  }, [rawLocation, setCurrentLocation]);

  if (!location) return null;

  const displayAccuracyRadius = 4;

  return (
    <>
      <Circle
        center={[location.lat, location.lng]}
        radius={displayAccuracyRadius}
        pathOptions={{
          color: "#2563eb",
          fillColor: "#2563eb",
          fillOpacity: 0.15,
        }}
      />

      <Marker
        position={[location.lat, location.lng]}
        icon={userIcon}
      >
        <Popup>
          <b>Your Current Location</b>

          <br />
          <br />

          Display Latitude:
          <br />
          {location.lat}

          <br />
          <br />

          Display Longitude:
          <br />
          {location.lng}

          <br />
          <br />

          GPS Accuracy:
          <br />
          {Math.round(location.accuracy)} m

          <br />
          <br />
          Display Radius:
          <br />
          4 m
          <br />
          <br />

          {location.isSnapped ? (
            <>
              <b>Path Snapping: Active</b>

              <br />
              Snapped to walkway:
              <br />
              {location.snapDistance?.toFixed(2)} m away
            </>
          ) : (
            <b>Path Snapping: Not Active</b>
          )}
        </Popup>
      </Marker>
    </>
  );
}