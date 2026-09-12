import { useEffect } from "react";

import {
  Marker,
  Popup,
  Circle,
} from "react-leaflet";

import L from "leaflet";

import { useLocation } from "../../hooks/useLocation";
import { useNavigation } from "../../hooks/useNavigation";

// ==========================================
// SmartNav Current Location Icon
// ==========================================

const userIcon = L.divIcon({
  className: "smartnav-current-location-icon",

  html: `
    <div
      style="
        position: relative;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >

      <!-- Outer location halo -->
      <div
        style="
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.14);
        "
      ></div>

      <!-- White border -->
      <div
        style="
          position: relative;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow:
            0 2px 8px rgba(20, 33, 55, 0.28);
        "
      >

        <!-- Blue GPS dot -->
        <div
          style="
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #2563EB;
          "
        ></div>

      </div>

    </div>
  `,

  iconSize: [24, 24],

  iconAnchor: [12, 12],
});

export default function CurrentLocation() {
  const {
    location,
    rawLocation,
  } = useLocation();

  const {
    setCurrentLocation,
  } = useNavigation();

  // ========================================
  // Navigation continues using RAW GPS
  // ========================================

  useEffect(() => {
    if (rawLocation) {
      setCurrentLocation(rawLocation);
    }
  }, [
    rawLocation,
    setCurrentLocation,
  ]);

  if (!location) {
    return null;
  }

  // ========================================
  // Visual accuracy radius
  // ========================================

  const displayAccuracyRadius = 4;

  return (
    <>
      {/* ====================================
          GPS visual radius
          ==================================== */}

      <Circle
        center={[
          location.lat,
          location.lng,
        ]}
        radius={displayAccuracyRadius}
        pane="markerPane"
        pathOptions={{
          color: "#2563EB",
          fillColor: "#2563EB",
          fillOpacity: 0.10,
          weight: 1.5,
        }}
      />

      {/* ====================================
          GPS marker
          ==================================== */}

      <Marker
        position={[
          location.lat,
          location.lng,
        ]}
        icon={userIcon}
        pane="markerPane"
        zIndexOffset={10000}
      >
        <Popup>
          <b>Your Current Location</b>

          <br />
          <br />

          Latitude:
          <br />
          {location.lat}

          <br />
          <br />

          Longitude:
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
        </Popup>
      </Marker>
    </>
  );
}