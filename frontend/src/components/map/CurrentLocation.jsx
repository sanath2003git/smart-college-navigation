import { useEffect } from "react";

import {
  Marker,
  Popup,
  Circle,
} from "react-leaflet";

import L from "leaflet";

import { useLocation } from "../../hooks/useLocation";
import { useNavigation } from "../../hooks/useNavigation";
import useDeviceHeading from "../../hooks/useDeviceHeading";

// ==========================================
// SmartNav Current Location Icon
// ==========================================

const createUserIcon = (heading) => {
  const rotation = heading ?? 0;

  return L.divIcon({
    className: "smartnav-current-location-icon",

    html: `
      <div
        style="
          position: relative;
          width: 70px;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >

        <!-- Direction cone -->
        <div
          style="
            position: absolute;
            width: 0;
            height: 0;
            left: 50%;
            top: 50%;
            border-left: 25px solid transparent;
            border-right: 25px solid transparent;
            border-bottom: 55px solid rgba(37, 99, 235, 0.16);
            transform-origin: 50% 100%;
            transform:
              translate(-50%, -100%)
              rotate(${rotation}deg);
            pointer-events: none;
          "
        ></div>

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
            z-index: 2;
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

    iconSize: [70, 70],
    iconAnchor: [35, 35],
  });
};

export default function CurrentLocation() {
  const {
    location,
    rawLocation,
  } = useLocation();

  const {
    setCurrentLocation,
  } = useNavigation();

  const heading = useDeviceHeading();

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
        icon={createUserIcon(heading)}
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

          <br />
          <br />

          Device Heading:
          <br />
          {heading !== null
            ? `${Math.round(heading)}°`
            : "Unavailable"}
        </Popup>
      </Marker>
    </>
  );
}